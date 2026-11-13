import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { dirname, join } from "path";
import { afterAll, describe, expect, it } from "vitest";

import { copyExample, listExamples, pickExamples } from "../scripts/examples";

const TMP = mkdtempSync(join(tmpdir(), "nf-examples-"));
const CHECKOUT = join(TMP, "examples");

const write = (path: string, content: unknown) => {
  mkdirSync(dirname(join(CHECKOUT, path)), { recursive: true });
  writeFileSync(
    join(CHECKOUT, path),
    typeof content === "string" ? content : JSON.stringify(content),
  );
};

const deps = { "@nanoforge-dev/core": "^3.0.0", "@nanoforge-dev/cli": "^3.0.1" };
write("basics/pong/package.json", { devDependencies: deps });
write("basics/pong/apps/client/package.json", { dependencies: deps });
write("basics/pong/src/main.ts", "export {};");
for (const skipped of [
  "node_modules/x/index.js",
  "dist/main.js",
  ".nanoforge/cache",
  "pnpm-lock.yaml",
])
  write(`basics/pong/${skipped}`, "");
write("demos/pong/package.json", {});
write("games/not-an-example/README.md", "");

const examples = listExamples(CHECKOUT);
const PACKAGES = new Map([["@nanoforge-dev/core", "/engine/packages/core"]]);

afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("pnpm examples", () => {
  it("lists the folders of basics, demos and games holding a package.json", () => {
    expect(examples.map((example) => example.id).sort()).toEqual(["basics/pong", "demos/pong"]);
  });

  it("picks by group/name and refuses ambiguous or unknown names", () => {
    expect(pickExamples(examples, ["demos/pong"]).map((example) => example.id)).toEqual([
      "demos/pong",
    ]);
    expect(() => pickExamples(examples, ["pong"])).toThrow(/ambiguous/);
    expect(() => pickExamples(examples, ["../pong"])).toThrow(/Unknown/);
  });

  it("copies without installs and builds, and links the local packages", () => {
    const dest = join(TMP, "copy");
    mkdirSync(dest);
    writeFileSync(join(dest, "stale.txt"), "");
    for (const pong of pickExamples(examples, ["basics/pong"])) copyExample(pong, dest, PACKAGES);

    expect(existsSync(join(dest, "stale.txt"))).toBe(false);
    expect(existsSync(join(dest, "src/main.ts"))).toBe(true);
    for (const skipped of ["node_modules", "dist", ".nanoforge", "pnpm-lock.yaml"])
      expect(existsSync(join(dest, skipped))).toBe(false);
    expect(existsSync(join(dest, "pnpm-workspace.yaml"))).toBe(true);
    for (const [file, field] of [
      ["package.json", "devDependencies"],
      ["apps/client/package.json", "dependencies"],
    ] as const)
      expect(JSON.parse(readFileSync(join(dest, file), "utf8"))[field]).toEqual({
        "@nanoforge-dev/core": "link:/engine/packages/core",
        "@nanoforge-dev/cli": "^3.0.1",
      });
    expect(existsSync(join(CHECKOUT, "basics/pong/dist/main.js"))).toBe(true);
  });
});
