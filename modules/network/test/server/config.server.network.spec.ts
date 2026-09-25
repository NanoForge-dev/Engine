import { registerEnv } from "@nanoforge-dev/env";
import { describe, expect, it } from "vitest";

import { ServerConfigNetwork } from "../../src/server";

const base = { LISTENING_UDP_PORT: "9000" };

describe("ServerConfigNetwork", () => {
  describe("ICE_PORT", () => {
    it("should be optional", async () => {
      const config = await registerEnv(ServerConfigNetwork, { ...base });
      expect(config.ICE_PORT).toBeUndefined();
    });

    it("should accept a valid port", async () => {
      const config = await registerEnv(ServerConfigNetwork, { ...base, ICE_PORT: "50000" });
      expect(config.ICE_PORT).toBe("50000");
    });

    it("should reject a value outside the port range", async () => {
      await expect(
        registerEnv(ServerConfigNetwork, { ...base, ICE_PORT: "70000" }),
      ).rejects.toThrow();
    });
  });

  describe("ADVERTISE_IP", () => {
    it("should be optional", async () => {
      const config = await registerEnv(ServerConfigNetwork, { ...base });
      expect(config.ADVERTISE_IP).toBeUndefined();
    });

    it("should accept an ipv4 address", async () => {
      const config = await registerEnv(ServerConfigNetwork, {
        ...base,
        ADVERTISE_IP: "203.0.113.7",
      });
      expect(config.ADVERTISE_IP).toBe("203.0.113.7");
    });

    it("should accept an ipv6 address", async () => {
      const config = await registerEnv(ServerConfigNetwork, {
        ...base,
        ADVERTISE_IP: "2001:db8::1",
      });
      expect(config.ADVERTISE_IP).toBe("2001:db8::1");
    });

    it("should reject a hostname, which is not valid in an ice candidate", async () => {
      await expect(
        registerEnv(ServerConfigNetwork, { ...base, ADVERTISE_IP: "game.example.com" }),
      ).rejects.toThrow();
    });
  });
});
