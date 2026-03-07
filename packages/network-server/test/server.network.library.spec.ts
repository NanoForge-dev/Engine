import { type InitContext, NfConfigException } from "@nanoforge-dev/common";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NetworkServerLibrary } from "../src";

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

const makeContext = (config: Record<string, unknown>) =>
  ({
    config: {
      registerConfig: vi.fn().mockResolvedValue(config),
    },
  }) as unknown as InitContext;

describe("NetworkServerLibrary", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("metadata", () => {
    it("should expose the correct library name", () => {
      expect(new NetworkServerLibrary().__name).toBe("NetworkServerLibrary");
    });
  });

  describe("config validation", () => {
    it("should throw NfConfigException when LISTENING_INTERFACE is not provided", async () => {
      const ctx = makeContext({ LISTENING_TCP_PORT: "9000", MAGIC_VALUE: "END" });
      await expect(new NetworkServerLibrary().__init(ctx)).rejects.toThrow(NfConfigException);
    });

    it("should throw NfConfigException when neither TCP nor UDP port is provided", async () => {
      const ctx = makeContext({ LISTENING_INTERFACE: "0.0.0.0", MAGIC_VALUE: "END" });
      await expect(new NetworkServerLibrary().__init(ctx)).rejects.toThrow(NfConfigException);
    });
  });

  describe("initialization", () => {
    it("should initialize a TCP server when only LISTENING_TCP_PORT is provided", async () => {
      const ctx = makeContext({
        LISTENING_TCP_PORT: "9000",
        LISTENING_INTERFACE: "0.0.0.0",
        MAGIC_VALUE: "END",
      });
      const lib = new NetworkServerLibrary();
      await lib.__init(ctx);
      expect(lib.tcp).toBeDefined();
      expect(lib.udp).toBeUndefined();
    });

    it("should initialize a UDP server when only LISTENING_UDP_PORT is provided", async () => {
      const ctx = makeContext({
        LISTENING_UDP_PORT: "9001",
        LISTENING_INTERFACE: "0.0.0.0",
        MAGIC_VALUE: "END",
      });
      const lib = new NetworkServerLibrary();
      await lib.__init(ctx);
      expect(lib.udp).toBeDefined();
      expect(lib.tcp).toBeUndefined();
    });

    it("should initialize both TCP and UDP servers when both ports are provided", async () => {
      const ctx = makeContext({
        LISTENING_TCP_PORT: "9000",
        LISTENING_UDP_PORT: "9001",
        LISTENING_INTERFACE: "0.0.0.0",
        MAGIC_VALUE: "END",
      });
      const lib = new NetworkServerLibrary();
      await lib.__init(ctx);
      expect(lib.tcp).toBeDefined();
      expect(lib.udp).toBeDefined();
    });
  });
});
