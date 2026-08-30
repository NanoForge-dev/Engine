import { describe, expect, it } from "vitest";

import { NanoforgeFactory } from "../src/application/nanoforge-factory";

describe("NanoforgeFactory", () => {
  it("creates a client that can be initialized", async () => {
    const client = NanoforgeFactory.createClient();
    await expect(
      client.init({ files: new Map(), env: {}, container: {} as unknown as HTMLDivElement }),
    ).resolves.toBeUndefined();
  });

  it("creates a server that can be initialized", async () => {
    const server = NanoforgeFactory.createServer({ tickRate: 30 });
    await expect(server.init({ files: new Map(), env: {} })).resolves.toBeUndefined();
  });
});
