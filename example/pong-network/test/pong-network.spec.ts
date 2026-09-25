import { NfNotFound } from "@nanoforge-dev/common";
import { describe, expect, it } from "vitest";

// The client app instantiates a Konva layer at import time and needs a real browser canvas.
import { main as serverMain } from "../apps/server/src/main";

describe("pong-network server", () => {
  it("should reject startup when libecs.wasm is missing", async () => {
    await expect(serverMain({ files: new Map(), env: {} })).rejects.toBeInstanceOf(NfNotFound);
  });
});
