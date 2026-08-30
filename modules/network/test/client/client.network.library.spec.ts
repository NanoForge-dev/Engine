import type { InitContext } from "@nanoforge-dev/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NetworkClientLibrary } from "../../src/client";

const makeInitContext = (env: Record<string, string>): InitContext => ({
  vars: { get: () => undefined, set: () => {} },
  env,
  files: new Map(),
});

describe("NetworkClientLibrary", () => {
  beforeEach(() => {
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
  });

  describe("metadata", () => {
    it("should expose the reserved 'network' key", () => {
      expect(new NetworkClientLibrary().key).toBe("network");
    });
  });

  describe("config validation", () => {
    it("should throw when neither TCP nor UDP port is provided", async () => {
      const ctx = makeInitContext({ SERVER_ADDRESS: "127.0.0.1", MAGIC_VALUE: "END" });
      await expect(new NetworkClientLibrary().__init(ctx)).rejects.toThrow();
    });
  });

  describe("initialization", () => {
    it("should initialize a TCP client when only SERVER_TCP_PORT is provided", async () => {
      const ctx = makeInitContext({
        SERVER_TCP_PORT: "8080",
        SERVER_ADDRESS: "127.0.0.1",
        MAGIC_VALUE: "END",
      });
      const lib = new NetworkClientLibrary();
      await lib.__init(ctx);
      expect(lib.tcp).toBeDefined();
      expect(lib.udp).toBeUndefined();
    });

    it("should initialize a UDP client when only SERVER_UDP_PORT is provided", async () => {
      const ctx = makeInitContext({
        SERVER_UDP_PORT: "8081",
        SERVER_ADDRESS: "127.0.0.1",
        MAGIC_VALUE: "END",
      });
      const lib = new NetworkClientLibrary();
      await lib.__init(ctx);
      expect(lib.udp).toBeDefined();
      expect(lib.tcp).toBeUndefined();
    });

    it("should initialize both TCP and UDP clients when both ports are provided", async () => {
      const ctx = makeInitContext({
        SERVER_TCP_PORT: "8080",
        SERVER_UDP_PORT: "8081",
        SERVER_ADDRESS: "127.0.0.1",
        MAGIC_VALUE: "END",
      });
      const lib = new NetworkClientLibrary();
      await lib.__init(ctx);
      expect(lib.tcp).toBeDefined();
      expect(lib.udp).toBeDefined();
    });

    it("should default MAGIC_VALUE and WSS when not provided", async () => {
      const ctx = makeInitContext({ SERVER_TCP_PORT: "8080", SERVER_ADDRESS: "127.0.0.1" });
      const lib = new NetworkClientLibrary();
      await expect(lib.__init(ctx)).resolves.toBeUndefined();
    });
  });

  describe("expose", () => {
    it("returns the tcp/udp clients", async () => {
      const ctx = makeInitContext({
        SERVER_TCP_PORT: "8080",
        SERVER_ADDRESS: "127.0.0.1",
        MAGIC_VALUE: "END",
      });
      const lib = new NetworkClientLibrary();
      await lib.__init(ctx);
      expect(lib.expose().tcp).toBe(lib.tcp);
      expect(lib.expose().udp).toBeUndefined();
    });
  });
});
