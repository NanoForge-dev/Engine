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
    it("should throw NfConfigException when listeningInterface is not provided", async () => {
      const ctx = makeContext({ listeningTcpPort: "9000", magicValue: "END" });
      await expect(new NetworkServerLibrary().__init(ctx)).rejects.toThrow(NfConfigException);
    });

    it("should throw NfConfigException when neither TCP nor UDP port is provided", async () => {
      const ctx = makeContext({ listeningInterface: "0.0.0.0", magicValue: "END" });
      await expect(new NetworkServerLibrary().__init(ctx)).rejects.toThrow(NfConfigException);
    });
  });

  describe("initialization", () => {
    it("should initialize a TCP server when only listeningTcpPort is provided", async () => {
      const ctx = makeContext({
        listeningTcpPort: "9000",
        listeningInterface: "0.0.0.0",
        magicValue: "END",
      });
      const lib = new NetworkServerLibrary();
      await lib.__init(ctx);
      expect(lib.tcp).toBeDefined();
      expect(lib.udp).toBeUndefined();
    });

    it("should initialize a UDP server when only listeningUdpPort is provided", async () => {
      const ctx = makeContext({
        listeningUdpPort: "9001",
        listeningInterface: "0.0.0.0",
        magicValue: "END",
      });
      const lib = new NetworkServerLibrary();
      await lib.__init(ctx);
      expect(lib.udp).toBeDefined();
      expect(lib.tcp).toBeUndefined();
    });

    it("should initialize both TCP and UDP servers when both ports are provided", async () => {
      const ctx = makeContext({
        listeningTcpPort: "9000",
        listeningUdpPort: "9001",
        listeningInterface: "0.0.0.0",
        magicValue: "END",
      });
      const lib = new NetworkServerLibrary();
      await lib.__init(ctx);
      expect(lib.tcp).toBeDefined();
      expect(lib.udp).toBeDefined();
    });
  });
});
