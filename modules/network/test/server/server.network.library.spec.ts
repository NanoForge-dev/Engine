import type { InitContext } from "@nanoforge-dev/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Channel, NetworkData, NetworkServerLibrary } from "../../src/server";

vi.mock("node-datachannel/polyfill", () => ({
  RTCPeerConnection: vi.fn(function (this: any) {
    this.onconnectionstatechange = null;
    this.onicecandidate = null;
    this.ondatachannel = null;
    this.close = vi.fn();
  }),
}));

const serve = vi.fn();
const file = vi.fn((path: string) => ({ path }));

beforeEach(() => {
  serve.mockImplementation(() => ({ stop: vi.fn() }));
  vi.stubGlobal("Bun", { serve, file });
});

const makeInitContext = (env: Record<string, string>): InitContext => ({
  vars: { get: () => undefined, set: () => {} },
  env,
  files: new Map(),
});

/** Open a socket on the `index`-th `Bun.serve` call, the way Bun would. */
const openSocket = (index: number, url: string) => {
  const options = serve.mock.calls[index]?.[0];
  let data: any;
  options.fetch(new Request(url), {
    requestIP: () => ({ address: "127.0.0.1", family: "IPv4", port: 1234 }),
    upgrade: (_request: unknown, opts: { data: unknown }) => {
      data = opts.data;
      return true;
    },
  });
  const webSocket = { data, send: vi.fn(), close: vi.fn() };
  options.websocket.open(webSocket);
  const welcome = JSON.parse(webSocket.send.mock.calls[0]?.[0]);
  webSocket.send.mockClear();
  return { webSocket, options, welcome };
};

/** Stand-in for a data channel the client opened, labelled `label`. */
const makeDataChannel = (label: string) => ({
  label,
  send: vi.fn(),
  close: vi.fn(),
  onopen: null as null | (() => void),
  onmessage: null as null | ((event: { data: ArrayBuffer }) => void),
  onclose: null as null | (() => void),
  onerror: null as null | ((event: unknown) => void),
});

const utf8 = (text: string) => new TextEncoder().encode(text);

/** The payload bytes of each received packet. */
const bytesOf = (packets: NetworkData[] | undefined) => packets?.map((packet) => packet.bytes());

const tcpOnly = { LISTENING_TCP_PORT: "9000" };
const udpOnly = { LISTENING_UDP_PORT: "9001" };
const both = { LISTENING_TCP_PORT: "9000", LISTENING_UDP_PORT: "9001" };

describe("NetworkServerLibrary", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe("metadata", () => {
    it("should expose the reserved 'network' key", () => {
      expect(new NetworkServerLibrary().key).toBe("network");
    });
  });

  describe("runtime", () => {
    it("should refuse to start outside the Bun runtime with a clear message", async () => {
      vi.unstubAllGlobals();
      const ctx = makeInitContext({ LISTENING_TCP_PORT: "9000" });

      await expect(new NetworkServerLibrary().__init(ctx)).rejects.toThrow(
        "the Bun runtime is required",
      );
    });
  });

  describe("config validation", () => {
    it("should throw when neither TCP nor UDP port is provided", async () => {
      const ctx = makeInitContext({});
      await expect(new NetworkServerLibrary().__init(ctx)).rejects.toThrow();
    });

    it("should throw when only WSS_CERT is provided without WSS_KEY", async () => {
      const ctx = makeInitContext({ LISTENING_TCP_PORT: "9000", WSS_CERT: "cert.pem" });
      await expect(new NetworkServerLibrary().__init(ctx)).rejects.toThrow();
    });
  });

  describe("initialization", () => {
    it("should initialize a TCP server when only LISTENING_TCP_PORT is provided", async () => {
      const ctx = makeInitContext({ LISTENING_TCP_PORT: "9000" });
      const lib = new NetworkServerLibrary();
      await lib.__init(ctx);
      expect(() => lib.sendToAll(new Uint8Array([1]))).not.toThrow();
      expect(() =>
        lib.sendToAll(new Uint8Array([1]), { channel: Channel.UnreliableOrdered }),
      ).toThrow("Channel unreliable-ordered needs LISTENING_UDP_PORT to be set");
    });

    it("should initialize a UDP server when only LISTENING_UDP_PORT is provided", async () => {
      const ctx = makeInitContext({ LISTENING_UDP_PORT: "9001" });
      const lib = new NetworkServerLibrary();
      await lib.__init(ctx);
      expect(() =>
        lib.sendToAll(new Uint8Array([1]), { channel: Channel.UnreliableOrdered }),
      ).not.toThrow();
      expect(() => lib.sendToAll(new Uint8Array([1]))).toThrow(
        "Channel reliable-ordered needs LISTENING_TCP_PORT to be set",
      );
    });

    it("should initialize both TCP and UDP servers when both ports are provided", async () => {
      const ctx = makeInitContext({
        LISTENING_TCP_PORT: "9000",
        LISTENING_UDP_PORT: "9001",
      });
      const lib = new NetworkServerLibrary();
      await lib.__init(ctx);
      expect(() => lib.sendToAll(new Uint8Array([1]))).not.toThrow();
      expect(() =>
        lib.sendToAll(new Uint8Array([1]), { channel: Channel.UnreliableUnordered }),
      ).not.toThrow();
    });

    it("should default LISTENING_INTERFACE to 0.0.0.0 when not provided", async () => {
      const ctx = makeInitContext({ LISTENING_TCP_PORT: "9000" });
      const lib = new NetworkServerLibrary();
      await expect(lib.__init(ctx)).resolves.toBeUndefined();
    });
  });

  describe("channels", () => {
    it("should send on ReliableOrdered when no channel is given", async () => {
      const lib = new NetworkServerLibrary();
      await lib.__init(makeInitContext(tcpOnly));
      const { webSocket, welcome } = openSocket(0, "http://localhost:9000/");

      lib.sendToAll(new Uint8Array([1]));
      lib.sendToClient(welcome.id, new Uint8Array([2]));
      expect(webSocket.send.mock.calls).toStrictEqual([
        [new Uint8Array([0, 1])],
        [new Uint8Array([0, 2])],
      ]);
    });

    it("should send each channel on its own transport", async () => {
      const lib = new NetworkServerLibrary();
      await lib.__init(makeInitContext(both));
      const tcp = openSocket(0, "http://localhost:9000/");
      const udp = openSocket(1, `http://localhost:9001/?token=${tcp.welcome.token}`);
      const unordered = makeDataChannel("unreliable-unordered");
      udp.webSocket.data.peerConnection.ondatachannel({ channel: unordered });

      lib.sendToClient(tcp.welcome.id, new Uint8Array([1]), {
        channel: Channel.ReliableUnordered,
      });
      lib.sendToAll(new Uint8Array([2]), { channel: Channel.UnreliableUnordered });

      expect(tcp.webSocket.send).toHaveBeenCalledWith(new Uint8Array([1, 1]));
      expect(unordered.send).toHaveBeenCalledWith(new Uint8Array([2]));
    });

    it("should send strings as UTF-8 and other values as JSON", async () => {
      const lib = new NetworkServerLibrary();
      await lib.__init(makeInitContext(both));
      const tcp = openSocket(0, "http://localhost:9000/");
      const udp = openSocket(1, `http://localhost:9001/?token=${tcp.welcome.token}`);
      const unordered = makeDataChannel("unreliable-unordered");
      udp.webSocket.data.peerConnection.ondatachannel({ channel: unordered });

      lib.sendToClient(tcp.welcome.id, { type: "assignId", id: 0 });
      lib.sendToAll("hi", { channel: Channel.UnreliableUnordered });

      expect(tcp.webSocket.send).toHaveBeenCalledWith(
        new Uint8Array([0, ...utf8('{"type":"assignId","id":0}')]),
      );
      expect(unordered.send).toHaveBeenCalledWith(utf8("hi"));
    });

    it("should relay a received packet as it is", async () => {
      const lib = new NetworkServerLibrary();
      await lib.__init(makeInitContext(tcpOnly));
      const { webSocket, options, welcome } = openSocket(0, "http://localhost:9000/");

      options.websocket.message(webSocket, Buffer.from([0, ...utf8('{"type":"input"}')]));
      const [packet] = lib.getReceivedPackets().get(welcome.id) ?? [];
      expect(packet).toBeInstanceOf(NetworkData);
      expect(packet?.json()).toStrictEqual({ type: "input" });

      lib.sendToAll(packet!);
      expect(webSocket.send).toHaveBeenCalledWith(new Uint8Array([0, ...utf8('{"type":"input"}')]));
    });

    it("should read one channel, or merge every channel per client", async () => {
      const lib = new NetworkServerLibrary();
      await lib.__init(makeInitContext(both));
      const tcp = openSocket(0, "http://localhost:9000/");
      const udp = openSocket(1, `http://localhost:9001/?token=${tcp.welcome.token}`);
      const unordered = makeDataChannel("unreliable-unordered");
      udp.webSocket.data.peerConnection.ondatachannel({ channel: unordered });
      const id = tcp.welcome.id;

      unordered.onmessage?.({ data: new Uint8Array([9]).buffer });
      tcp.options.websocket.message(tcp.webSocket, Buffer.from([1, 2]));
      tcp.options.websocket.message(tcp.webSocket, Buffer.from([0, 1]));

      expect(
        bytesOf(lib.getReceivedPackets({ channel: Channel.ReliableUnordered }).get(id)),
      ).toStrictEqual([new Uint8Array([2])]);
      expect(bytesOf(lib.getReceivedPackets().get(id))).toStrictEqual([
        new Uint8Array([1]),
        new Uint8Array([9]),
      ]);
      expect(lib.getReceivedPackets().get(id)).toStrictEqual([]);
    });

    it("should list the clients of one channel, or of any channel", async () => {
      const lib = new NetworkServerLibrary();
      await lib.__init(makeInitContext(both));
      const tcp = openSocket(0, "http://localhost:9000/");
      const udpOnlyClient = openSocket(1, "http://localhost:9001/");
      udpOnlyClient.webSocket.data.peerConnection.ondatachannel({
        channel: makeDataChannel("unreliable-ordered"),
      });

      expect(lib.getConnectedClients({ channel: Channel.ReliableOrdered })).toStrictEqual([
        tcp.welcome.id,
      ]);
      expect(lib.getConnectedClients({ channel: Channel.UnreliableOrdered })).toStrictEqual([
        udpOnlyClient.welcome.id,
      ]);
      expect(lib.getConnectedClients({ channel: Channel.UnreliableUnordered })).toStrictEqual([]);
      expect(lib.getConnectedClients()).toStrictEqual([tcp.welcome.id, udpOnlyClient.welcome.id]);
    });

    it("should look up client info", async () => {
      const lib = new NetworkServerLibrary();
      await lib.__init(makeInitContext(udpOnly));
      const { welcome } = openSocket(0, "http://localhost:9001/");

      expect(lib.getClientInfo(welcome.id)).toBe(lib.clients.get(welcome.id));
    });
  });

  describe("expose", () => {
    it("delegates to the library", async () => {
      const lib = new NetworkServerLibrary();
      await lib.__init(makeInitContext(tcpOnly));
      const api = lib.expose();
      const { webSocket, welcome } = openSocket(0, "http://localhost:9000/");

      api.sendToAll(new Uint8Array([1]), { channel: Channel.ReliableUnordered });
      api.sendToClient(welcome.id, new Uint8Array([2]));
      expect(webSocket.send.mock.calls).toStrictEqual([
        [new Uint8Array([1, 1])],
        [new Uint8Array([0, 2])],
      ]);
      expect(api.getConnectedClients()).toStrictEqual([welcome.id]);
      expect(api.getReceivedPackets().get(welcome.id)).toStrictEqual([]);
      expect(api.getClientInfo(welcome.id)?.id).toBe(welcome.id);
      expect(() => api.sendToAll(new Uint8Array(), { channel: Channel.UnreliableOrdered })).toThrow(
        "LISTENING_UDP_PORT",
      );
    });

    it("returns the client sessions", () => {
      const lib = new NetworkServerLibrary();
      expect(lib.expose().clients).toBe(lib.clients);
    });
  });

  describe("sessions", () => {
    /** Open a socket on the `index`-th `Bun.serve` call and return its welcome. */
    const open = (index: number, url: string) => openSocket(index, url).welcome;

    it("should share one client session between the TCP and UDP servers", async () => {
      const ctx = makeInitContext({ LISTENING_TCP_PORT: "9000", LISTENING_UDP_PORT: "9001" });
      const lib = new NetworkServerLibrary();
      await lib.__init(ctx);

      const tcpWelcome = open(0, "http://localhost:9000/");
      const udpWelcome = open(1, `http://localhost:9001/?token=${tcpWelcome.token}`);

      expect(udpWelcome.id).toBe(tcpWelcome.id);
      expect(lib.clients.list()).toHaveLength(1);
      expect(Object.keys(lib.clients.get(tcpWelcome.id)!.transports)).toStrictEqual(["tcp", "udp"]);
    });

    it("should forget the sessions on __clear", async () => {
      const ctx = makeInitContext({ LISTENING_TCP_PORT: "9000" });
      const lib = new NetworkServerLibrary();
      await lib.__init(ctx);
      open(0, "http://localhost:9000/");

      await lib.__clear({} as never);
      expect(lib.clients.list()).toStrictEqual([]);
    });
  });
  describe("teardown", () => {
    it("should stop both servers and drop them on __clear", async () => {
      const stop = vi.fn();
      serve.mockImplementation(() => ({ stop }));

      const ctx = makeInitContext({
        LISTENING_TCP_PORT: "9000",
        LISTENING_UDP_PORT: "9001",
      });
      const lib = new NetworkServerLibrary();
      await lib.__init(ctx);
      await lib.__clear({} as never);

      expect(stop).toHaveBeenCalledTimes(2);
      expect(() => lib.sendToAll(new Uint8Array())).toThrow("LISTENING_TCP_PORT");
      expect(() => lib.sendToAll(new Uint8Array(), { channel: Channel.UnreliableOrdered })).toThrow(
        "LISTENING_UDP_PORT",
      );
    });
  });
});
