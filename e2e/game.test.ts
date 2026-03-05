import { execSync } from "child_process";
import { existsSync, rmSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const PROJECT_DIR = join(dirname(fileURLToPath(import.meta.url)), "./game");

describe("E2E Game", () => {
  beforeAll(() => {
    rmSync(join(PROJECT_DIR, ".nanoforge"), { recursive: true, force: true });
    execSync("nf build", {
      cwd: PROJECT_DIR,
      stdio: "pipe",
      timeout: 120_000,
    });
  }, 130_000);

  afterAll(() => {
    rmSync(join(PROJECT_DIR, ".nanoforge"), { recursive: true, force: true });
  }, 130_000);

  describe("Build", () => {
    it("should produce a server bundle", () => {
      expect(existsSync(join(PROJECT_DIR, ".nanoforge/server/main.js"))).toBe(true);
    });

    it("should produce a client bundle directory", () => {
      expect(existsSync(join(PROJECT_DIR, ".nanoforge/client"))).toBe(true);
    });

    it("should include the WASM file in the server bundle", () => {
      expect(existsSync(join(PROJECT_DIR, ".nanoforge/server/libecs.wasm"))).toBe(true);
    });
  });

  describe("Server", () => {
    it("should start, run for 5 ticks, and exit cleanly", () => {
      execSync("bun run ../run-server.mjs", {
        cwd: PROJECT_DIR,
        stdio: "pipe",
        timeout: 15_000,
      });
    }, 20_000);
  });
});
