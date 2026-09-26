import { describe, expect, it } from "vitest";

import { Expose, IsInt, IsString, NfEnvValidationException, registerEnv } from "../src";

class ServerEnv {
  @Expose()
  @IsString()
  HOST!: string;

  @Expose()
  @IsInt()
  PORT!: number;
}

describe("registerEnv", () => {
  it("returns a populated, typed instance for valid env", async () => {
    const config = await registerEnv(ServerEnv, { HOST: "localhost", PORT: 3000 });
    expect(config.HOST).toBe("localhost");
    expect(config.PORT).toBe(3000);
  });

  it("throws NfEnvValidationException for invalid env", async () => {
    await expect(
      registerEnv(ServerEnv, { HOST: "localhost", PORT: "not-a-number" }),
    ).rejects.toThrow(NfEnvValidationException);
  });

  it("names the failing field in the error message", async () => {
    await expect(
      registerEnv(ServerEnv, { HOST: "localhost", PORT: "not-a-number" }),
    ).rejects.toThrow(/PORT/);
  });
});
