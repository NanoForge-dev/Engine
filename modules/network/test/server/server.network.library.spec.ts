import type { InitContext } from "@nanoforge-dev/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NetworkServerLibrary } from "../../src/server";

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
      const ctx = makeInitContext({ LISTENING_TCP_PORT: "9000", MAGIC_VALUE: "END" });

      await expect(new NetworkServerLibrary().__init(ctx)).rejects.toThrow(
        "the Bun runtime is required",
      );
    });
  });

  describe("config validation", () => {
    it("should throw when neither TCP nor UDP port is provided", async () => {
      const ctx = makeInitContext({ MAGIC_VALUE: "END" });
      await expect(new NetworkServerLibrary().__init(ctx)).rejects.toThrow();
    });

    it("should throw when only WSS_CERT is provided without WSS_KEY", async () => {
      const ctx = makeInitContext({ LISTENING_TCP_PORT: "9000", WSS_CERT: "cert.pem" });
      await expect(new NetworkServerLibrary().__init(ctx)).rejects.toThrow();
    });
  });

  describe("initialization", () => {
    it("should initialize a TCP server when only LISTENING_TCP_PORT is provided", async () => {
      const ctx = makeInitContext({ LISTENING_TCP_PORT: "9000", MAGIC_VALUE: "END" });
      const lib = new NetworkServerLibrary();
      await lib.__init(ctx);
      expect(lib.tcp).toBeDefined();
      expect(lib.udp).toBeUndefined();
    });

    it("should initialize a UDP server when only LISTENING_UDP_PORT is provided", async () => {
      const ctx = makeInitContext({ LISTENING_UDP_PORT: "9001", MAGIC_VALUE: "END" });
      const lib = new NetworkServerLibrary();
      await lib.__init(ctx);
      expect(lib.udp).toBeDefined();
      expect(lib.tcp).toBeUndefined();
    });

    it("should initialize both TCP and UDP servers when both ports are provided", async () => {
      const ctx = makeInitContext({
        LISTENING_TCP_PORT: "9000",
        LISTENING_UDP_PORT: "9001",
        MAGIC_VALUE: "END",
      });
      const lib = new NetworkServerLibrary();
      await lib.__init(ctx);
      expect(lib.tcp).toBeDefined();
      expect(lib.udp).toBeDefined();
    });

    it("should default LISTENING_INTERFACE to 0.0.0.0 and MAGIC_VALUE when not provided", async () => {
      const ctx = makeInitContext({ LISTENING_TCP_PORT: "9000" });
      const lib = new NetworkServerLibrary();
      await expect(lib.__init(ctx)).resolves.toBeUndefined();
    });
  });

  describe("expose", () => {
    it("returns the tcp/udp servers", async () => {
      const ctx = makeInitContext({ LISTENING_TCP_PORT: "9000" });
      const lib = new NetworkServerLibrary();
      await lib.__init(ctx);
      expect(lib.expose().tcp).toBe(lib.tcp);
      expect(() => lib.expose().udp).toThrow("UDP isn't defined");
    });

    it("returns the client sessions", () => {
      const lib = new NetworkServerLibrary();
      expect(lib.expose().clients).toBe(lib.clients);
    });
  });

  describe("sessions", () => {
    /** Open a socket on the `index`-th `Bun.serve` call and return what it was sent. */
    const open = (index: number, url: string) => {
      const options = serve.mock.calls[index]?.[0];
      let data: unknown;
      options.fetch(new Request(url), {
        requestIP: () => ({ address: "127.0.0.1", family: "IPv4", port: 1234 }),
        upgrade: (_request: unknown, opts: { data: unknown }) => {
          data = opts.data;
          return true;
        },
      });
      const webSocket = { data, send: vi.fn(), close: vi.fn() };
      options.websocket.open(webSocket);
      return JSON.parse(webSocket.send.mock.calls[0]?.[0]);
    };

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
        MAGIC_VALUE: "END",
      });
      const lib = new NetworkServerLibrary();
      await lib.__init(ctx);
      expect(lib.tcp).toBeDefined();
      expect(lib.udp).toBeDefined();

      await lib.__clear({} as never);

      expect(stop).toHaveBeenCalledTimes(2);
      expect(lib.tcp).toBeUndefined();
      expect(lib.udp).toBeUndefined();
    });
  });
});
