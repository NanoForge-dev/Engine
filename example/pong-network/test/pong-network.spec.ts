import { describe, expect, it } from "vitest";

import { main as clientMain } from "../apps/client/src/main";
import { main as serverMain } from "../apps/server/src/main";

describe("pong-network plumbing skeleton", () => {
  it("server app runs its tick loop and stops cleanly", async () => {
    await expect(serverMain({ files: new Map(), env: {} })).resolves.toBeUndefined();
  });

  it("client app runs its tick loop, writes vars, and stops cleanly", async () => {
    const container = {} as unknown as HTMLDivElement;
    await expect(clientMain({ files: new Map(), env: {}, container })).resolves.toBeUndefined();
  });
});
