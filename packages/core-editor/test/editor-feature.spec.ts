import { Expose } from "class-transformer";
import { IsString } from "class-validator";
import { describe, expect, it } from "vitest";

import { ConfigRegistry } from "../src/config/config-registry";

class ValidConfig {
  @Expose()
  @IsString()
  name!: string;
}

class OptionalConfig {
  @Expose()
  @IsString()
  name!: string;

  @Expose()
  host?: string;
}

describe("ConfigRegistry", () => {
  describe("registerConfig", () => {
    it("should return a transformed config instance when env is valid", async () => {
      const registry = new ConfigRegistry({ name: "hello" });
      const config = await registry.registerConfig(ValidConfig);
      expect(config).toBeInstanceOf(ValidConfig);
      expect(config.name).toBe("hello");
    });

    it("should exclude values not decorated with @Expose", async () => {
      const registry = new ConfigRegistry({ name: "hello", extra: "ignored" });
      const config = await registry.registerConfig(ValidConfig);
      expect((config as any)["extra"]).toBeUndefined();
    });

    it("should throw when a required field is missing", async () => {
      const registry = new ConfigRegistry({});
      await expect(registry.registerConfig(ValidConfig)).rejects.toThrow();
    });

    it("should throw when a field has the wrong type", async () => {
      const registry = new ConfigRegistry({ name: 42 });
      await expect(registry.registerConfig(ValidConfig)).rejects.toThrow();
    });

    it("should map multiple env fields correctly", async () => {
      const registry = new ConfigRegistry({ name: "world", host: "localhost" });
      const config = await registry.registerConfig(OptionalConfig);
      expect(config.name).toBe("world");
      expect(config.host).toBe("localhost");
    });
  });
});
