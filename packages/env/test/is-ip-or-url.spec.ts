import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { describe, expect, it } from "vitest";

import { Expose, IsIpOrURL } from "../src";

class Fixture {
  @Expose()
  @IsIpOrURL()
  ADDRESS!: string;
}

describe("IsIpOrURL", () => {
  it("accepts a valid IPv4 address", async () => {
    const instance = plainToInstance(Fixture, { ADDRESS: "127.0.0.1" });
    expect(await validate(instance)).toHaveLength(0);
  });

  it("accepts a valid URL", async () => {
    const instance = plainToInstance(Fixture, { ADDRESS: "example.com" });
    expect(await validate(instance)).toHaveLength(0);
  });

  it("rejects an invalid value", async () => {
    const instance = plainToInstance(Fixture, { ADDRESS: "not a host!!" });
    expect(await validate(instance)).not.toHaveLength(0);
  });
});
