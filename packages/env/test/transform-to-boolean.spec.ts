import { plainToInstance } from "class-transformer";
import { describe, expect, it } from "vitest";

import { Expose, TransformToBoolean } from "../src";

class Fixture {
  @Expose()
  @TransformToBoolean()
  FLAG?: boolean;
}

describe("TransformToBoolean", () => {
  it("maps the string 'true' to true", () => {
    expect(plainToInstance(Fixture, { FLAG: "true" }).FLAG).toBe(true);
  });

  it("maps the string 'false' to false", () => {
    expect(plainToInstance(Fixture, { FLAG: "false" }).FLAG).toBe(false);
  });

  it("maps anything else to undefined", () => {
    expect(plainToInstance(Fixture, { FLAG: "yes" }).FLAG).toBeUndefined();
    expect(plainToInstance(Fixture, {}).FLAG).toBeUndefined();
  });
});
