import { plainToInstance } from "class-transformer";
import { describe, expect, it } from "vitest";

import { Default, Expose } from "../src";

class Fixture {
  @Expose()
  @Default("localhost")
  HOST!: string;
}

describe("Default", () => {
  it("uses the given value when present", () => {
    const instance = plainToInstance(Fixture, { HOST: "example.com" });
    expect(instance.HOST).toBe("example.com");
  });

  it("falls back to the default when the value is undefined", () => {
    const instance = plainToInstance(Fixture, {});
    expect(instance.HOST).toBe("localhost");
  });

  it("falls back to the default when the value is null", () => {
    const instance = plainToInstance(Fixture, { HOST: null });
    expect(instance.HOST).toBe("localhost");
  });

  it("does not share object defaults between instances", () => {
    class WithObjectDefault {
      @Expose()
      @Default({ count: 0 })
      opts!: { count: number };
    }

    const a = plainToInstance(WithObjectDefault, {});
    const b = plainToInstance(WithObjectDefault, {});
    a.opts.count = 5;
    expect(b.opts.count).toBe(0);
  });
});
