import type { InitContext } from "@nanoforge-dev/common";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NetworkServerLibrary } from "../../src/server";

vi.mock("ws", () => ({
  WebSocketServer: vi.fn(function (this: any) {
    this.on = vi.fn();
  }),
}));

vi.mock("wrtc", () => ({
  RTCPeerConnection: vi.fn(function (this: any) {
    this.onconnectionstatechange = null;
    this.onicecandidate = null;
    this.ondatachannel = null;
    this.close = vi.fn();
  }),
}));

const makeInitContext = (env: Record<string, string>): InitContext => ({
  vars: { get: () => undefined, set: () => {} },
  env,
  files: new Map(),
});

describe("NetworkServerLibrary", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("metadata", () => {
    it("should expose the reserved 'network' key", () => {
      expect(new NetworkServerLibrary().key).toBe("network");
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
      expect(lib.expose().udp).toBeUndefined();
    });
  });
});
