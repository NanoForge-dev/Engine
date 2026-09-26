import { registerEnv } from "@nanoforge-dev/env";
import { describe, expect, it } from "vitest";

import { ClientConfigNetwork } from "../../src/client";
import { ServerConfigNetwork } from "../../src/server";
import type { NetworkConfig } from "../../src/shared/config.network";

/** Each side's config class, viewed through the settings it inherits from `NetworkConfig`. */
type Side = {
  name: string;
  Config: new () => NetworkConfig;
  env: Record<string, string>;
};

const sides: Side[] = [
  { name: "client", Config: ClientConfigNetwork, env: { SERVER_ADDRESS: "127.0.0.1" } },
  { name: "server", Config: ServerConfigNetwork, env: { LISTENING_UDP_PORT: "9000" } },
];

describe.each(sides)("NetworkConfig inherited by the $name config", ({ Config, env }) => {
  it("should default MAGIC_VALUE to PACKET_END", async () => {
    const config = await registerEnv(Config, { ...env });
    expect(config.MAGIC_VALUE).toBe("PACKET_END");
  });

  it("should keep a provided MAGIC_VALUE", async () => {
    const config = await registerEnv(Config, { ...env, MAGIC_VALUE: "END" });
    expect(config.MAGIC_VALUE).toBe("END");
  });

  it("should reject a MAGIC_VALUE shorter than two bytes", async () => {
    await expect(registerEnv(Config, { ...env, MAGIC_VALUE: "E" })).rejects.toThrow();
  });

  describe("ICE_SERVERS", () => {
    it("should default to an empty list when unset", async () => {
      const config = await registerEnv(Config, { ...env });
      expect(config.ICE_SERVERS).toStrictEqual([]);
    });

    it("should default to an empty list when blank", async () => {
      const config = await registerEnv(Config, { ...env, ICE_SERVERS: "" });
      expect(config.ICE_SERVERS).toStrictEqual([]);
    });

    it("should parse a single comma-separated url into an ice server", async () => {
      const config = await registerEnv(Config, {
        ...env,
        ICE_SERVERS: "stun:stun.example.com:3478",
      });
      expect(config.ICE_SERVERS).toStrictEqual([{ urls: "stun:stun.example.com:3478" }]);
    });

    it("should map every comma-separated url to an object the peer connection accepts", async () => {
      const config = await registerEnv(Config, {
        ...env,
        ICE_SERVERS: "stun:a.example.com:3478,stun:b.example.com:19302",
      });
      expect(config.ICE_SERVERS).toStrictEqual([
        { urls: "stun:a.example.com:3478" },
        { urls: "stun:b.example.com:19302" },
      ]);
    });

    it("should tolerate whitespace and a trailing comma", async () => {
      const config = await registerEnv(Config, {
        ...env,
        ICE_SERVERS: " stun:a.example.com:3478 , stun:b.example.com:3478 ,",
      });
      expect(config.ICE_SERVERS).toStrictEqual([
        { urls: "stun:a.example.com:3478" },
        { urls: "stun:b.example.com:3478" },
      ]);
    });

    it("should reject a comma-separated entry that is not an ice url", async () => {
      await expect(
        registerEnv(Config, { ...env, ICE_SERVERS: "stun:a.example.com:3478,oops" }),
      ).rejects.toThrow();
    });

    it("should parse a JSON array of stun servers", async () => {
      const config = await registerEnv(Config, {
        ...env,
        ICE_SERVERS: '[{"urls":"stun:stun.example.com:3478"}]',
      });
      expect(config.ICE_SERVERS).toStrictEqual([{ urls: "stun:stun.example.com:3478" }]);
    });

    it("should parse turn servers with credentials", async () => {
      const config = await registerEnv(Config, {
        ...env,
        ICE_SERVERS:
          '[{"urls":"turn:turn.example.com:3478","username":"user","credential":"pass"}]',
      });
      expect(config.ICE_SERVERS).toStrictEqual([
        { urls: "turn:turn.example.com:3478", username: "user", credential: "pass" },
      ]);
    });

    it("should reject malformed JSON instead of silently disabling ice", async () => {
      await expect(registerEnv(Config, { ...env, ICE_SERVERS: "{not json" })).rejects.toThrow();
    });

    it("should reject a JSON value that is not an array", async () => {
      await expect(
        registerEnv(Config, { ...env, ICE_SERVERS: '{"urls":"stun:a:3478"}' }),
      ).rejects.toThrow();
    });
  });
});
