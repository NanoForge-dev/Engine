import { type InitContext, NfConfigException } from "@nanoforge-dev/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NetworkClientLibrary } from "../src";

const makeContext = (config: Record<string, unknown>) =>
  ({
    config: {
      registerConfig: vi.fn().mockResolvedValue(config),
    },
  }) as unknown as InitContext;

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
    it("should expose the correct library name", () => {
      expect(new NetworkClientLibrary().__name).toBe("NetworkClientLibrary");
    });
  });

  describe("config validation", () => {
    it("should throw NfConfigException when neither TCP nor UDP port is provided", async () => {
      const ctx = makeContext({ serverAddress: "127.0.0.1", magicValue: "END" });
      await expect(new NetworkClientLibrary().__init(ctx)).rejects.toThrow(NfConfigException);
    });
  });

  describe("initialization", () => {
    it("should initialize a TCP client when only serverTcpPort is provided", async () => {
      const ctx = makeContext({
        serverTcpPort: "8080",
        serverAddress: "127.0.0.1",
        magicValue: "END",
      });
      const lib = new NetworkClientLibrary();
      await lib.__init(ctx);
      expect(lib.tcp).toBeDefined();
      expect(lib.udp).toBeUndefined();
    });

    it("should initialize a UDP client when only serverUdpPort is provided", async () => {
      const ctx = makeContext({
        serverUdpPort: "8081",
        serverAddress: "127.0.0.1",
        magicValue: "END",
      });
      const lib = new NetworkClientLibrary();
      await lib.__init(ctx);
      expect(lib.udp).toBeDefined();
      expect(lib.tcp).toBeUndefined();
    });

    it("should initialize both TCP and UDP clients when both ports are provided", async () => {
      const ctx = makeContext({
        serverTcpPort: "8080",
        serverUdpPort: "8081",
        serverAddress: "127.0.0.1",
        magicValue: "END",
      });
      const lib = new NetworkClientLibrary();
      await lib.__init(ctx);
      expect(lib.tcp).toBeDefined();
      expect(lib.udp).toBeDefined();
    });
  });
});
