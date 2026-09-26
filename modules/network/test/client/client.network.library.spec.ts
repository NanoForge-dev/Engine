import type { InitContext } from "@nanoforge-dev/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NetworkClientLibrary } from "../../src/client";

const makeInitContext = (env: Record<string, string>): InitContext => ({
  vars: { get: () => undefined, set: () => {} },
  env,
  files: new Map(),
});

const welcome = { type: "welcome", id: "client-0", token: "t0k3n" };

describe("NetworkClientLibrary", () => {
  /** How the server answers each socket opened by the test, in order. Defaults to a welcome. */
  let answers: ("welcome" | "close")[];

  beforeEach(() => {
    answers = [];
    vi.stubGlobal(
      "WebSocket",
      Object.assign(
        vi.fn(function (this: any) {
          this.readyState = 0;
          this.binaryType = "";
          this.send = vi.fn();
          this.onerror = null;
          this.onopen = null;
          this.onmessage = null;
          this.onclose = null;
          const answer = answers.shift() ?? "welcome";
          setTimeout(() => {
            if (answer === "close") this.onclose?.();
            else this.onmessage?.({ data: JSON.stringify(welcome) });
          });
        }),
        { OPEN: 1 },
      ),
    );

    vi.stubGlobal(
      "RTCPeerConnection",
      vi.fn(function (this: any) {
        this.onicecandidate = null;
        this.createDataChannel = vi.fn(function (this: any) {
          return {
            readyState: "closed",
            send: vi.fn(),
            onopen: null,
            onmessage: null,
            onerror: null,
            onclose: null,
          };
        });
        this.createOffer = vi.fn().mockResolvedValue({});
        this.setLocalDescription = vi.fn().mockResolvedValue(undefined);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("metadata", () => {
    it("should expose the reserved 'network' key", () => {
      expect(new NetworkClientLibrary().key).toBe("network");
    });
  });

  describe("config validation", () => {
    it("should throw when neither TCP nor UDP port is provided", async () => {
      const ctx = makeInitContext({ SERVER_ADDRESS: "127.0.0.1" });
      await expect(new NetworkClientLibrary().__init(ctx)).rejects.toThrow();
    });
  });

  describe("initialization", () => {
    it("should initialize a TCP client when only SERVER_TCP_PORT is provided", async () => {
      const ctx = makeInitContext({
        SERVER_TCP_PORT: "8080",
        SERVER_ADDRESS: "127.0.0.1",
      });
      const lib = new NetworkClientLibrary();
      await lib.__init(ctx);
      expect(lib.reliableOrdered).toBeDefined();
      expect(lib.reliableUnordered).toBeDefined();
      expect(lib.unreliableOrdered).toBeUndefined();
      expect(lib.unreliableUnordered).toBeUndefined();
    });

    it("should hand ICE_SERVERS from the environment to the peer connection", async () => {
      const ctx = makeInitContext({
        SERVER_UDP_PORT: "8081",
        SERVER_ADDRESS: "127.0.0.1",
        ICE_SERVERS: "stun:stun.example.com:3478",
      });
      await new NetworkClientLibrary().__init(ctx);
      expect(RTCPeerConnection).toHaveBeenCalledWith({
        iceServers: [{ urls: "stun:stun.example.com:3478" }],
      });
    });

    it("should initialize a UDP client when only SERVER_UDP_PORT is provided", async () => {
      const ctx = makeInitContext({
        SERVER_UDP_PORT: "8081",
        SERVER_ADDRESS: "127.0.0.1",
      });
      const lib = new NetworkClientLibrary();
      await lib.__init(ctx);
      expect(lib.unreliableOrdered).toBeDefined();
      expect(lib.unreliableUnordered).toBeDefined();
      expect(lib.reliableOrdered).toBeUndefined();
      expect(lib.reliableUnordered).toBeUndefined();
    });

    it("should initialize both TCP and UDP clients when both ports are provided", async () => {
      const ctx = makeInitContext({
        SERVER_TCP_PORT: "8080",
        SERVER_UDP_PORT: "8081",
        SERVER_ADDRESS: "127.0.0.1",
      });
      const lib = new NetworkClientLibrary();
      await lib.__init(ctx);
      expect(lib.reliableOrdered).toBeDefined();
      expect(lib.unreliableUnordered).toBeDefined();
    });

    it("should link UDP to the session received over TCP", async () => {
      const ctx = makeInitContext({
        SERVER_TCP_PORT: "8080",
        SERVER_UDP_PORT: "8081",
        SERVER_ADDRESS: "127.0.0.1",
      });
      const lib = new NetworkClientLibrary();
      await lib.__init(ctx);

      expect(vi.mocked(WebSocket).mock.calls.map(([url]) => url)).toStrictEqual([
        "ws://127.0.0.1:8080",
        "ws://127.0.0.1:8081/?token=t0k3n",
      ]);
      expect(lib.clientId).toBe("client-0");
    });

    it("should still connect UDP, without a token, when TCP fails", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      answers = ["close"];
      const ctx = makeInitContext({
        SERVER_TCP_PORT: "8080",
        SERVER_UDP_PORT: "8081",
        SERVER_ADDRESS: "127.0.0.1",
      });
      const lib = new NetworkClientLibrary();

      await expect(lib.__init(ctx)).resolves.toBeUndefined();
      expect(vi.mocked(WebSocket).mock.calls[1]?.[0]).toBe("ws://127.0.0.1:8081");
      expect(lib.clientId).toBe("client-0");
    });

    it("should default WSS when not provided", async () => {
      const ctx = makeInitContext({ SERVER_TCP_PORT: "8080", SERVER_ADDRESS: "127.0.0.1" });
      const lib = new NetworkClientLibrary();
      await expect(lib.__init(ctx)).resolves.toBeUndefined();
    });
  });

  describe("channels", () => {
    it("should send each reliable channel over the same TCP socket", async () => {
      const ctx = makeInitContext({ SERVER_TCP_PORT: "8080", SERVER_ADDRESS: "127.0.0.1" });
      const lib = new NetworkClientLibrary();
      await lib.__init(ctx);

      lib.reliableOrdered!.sendData(new Uint8Array([1]));
      lib.reliableUnordered!.sendData(new Uint8Array([2]));

      const socket = vi.mocked(WebSocket).mock.instances[0] as any;
      expect(socket.send.mock.calls).toStrictEqual([
        [new Uint8Array([0, 1])],
        [new Uint8Array([1, 2])],
      ]);
    });

    it("should open one data channel per unreliable channel", async () => {
      const ctx = makeInitContext({ SERVER_UDP_PORT: "8081", SERVER_ADDRESS: "127.0.0.1" });
      await new NetworkClientLibrary().__init(ctx);

      const peerConnection = vi.mocked(RTCPeerConnection).mock.instances[0] as any;
      expect(
        peerConnection.createDataChannel.mock.calls.map(([label]: [string]) => label),
      ).toStrictEqual(["unreliable-ordered", "unreliable-unordered"]);
    });
  });

  describe("expose", () => {
    it("returns the channel clients", async () => {
      const ctx = makeInitContext({
        SERVER_TCP_PORT: "8080",
        SERVER_ADDRESS: "127.0.0.1",
      });
      const lib = new NetworkClientLibrary();
      await lib.__init(ctx);
      expect(lib.expose().reliableOrdered).toBe(lib.reliableOrdered);
      expect(lib.expose().reliableUnordered).toBe(lib.reliableUnordered);
      expect(() => lib.expose().unreliableOrdered).toThrow(
        "The unreliableOrdered channel isn't defined: set SERVER_UDP_PORT",
      );
      expect(() => lib.expose().unreliableUnordered).toThrow("SERVER_UDP_PORT");
      expect(lib.expose().clientId).toBe("client-0");
    });
  });
});
