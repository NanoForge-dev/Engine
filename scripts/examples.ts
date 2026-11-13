/**
 * `pnpm examples`: copies games of a local NanoForge examples checkout into `.examples/` and points
 * their engine dependencies at this repository's packages, to test them against the local engine.
 * The checkout is only read: the copies are installed and built, never the real games.
 *
 * Runs with Node's type stripping: no enums, no parameter properties.
 */
import { checkbox, input } from "@inquirer/prompts";
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

export interface Example {
  /** `<group>/<name>`, its path in the checkout and in `.examples/`. */
  id: string;
  name: string;
  dir: string;
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const COPY_ROOT = join(ROOT, ".examples");
const GROUPS = ["basics", "demos", "games"];
const PACKAGE_FOLDERS = ["packages", "modules", "utils"];
const SKIPPED = new Set(["node_modules", "dist", ".nanoforge", "pnpm-lock.yaml"]);
const DEPENDENCY_FIELDS = ["dependencies", "devDependencies", "optionalDependencies"];

const USAGE = `Usage: pnpm examples [--from <examples checkout>] (--games <a,b> | --all)

Copies examples into .examples/<group>/<name> and installs them against this engine.
The checkout is --from, else $NANOFORGE_EXAMPLES, else ../examples.
Without --games or --all, asks which ones to copy (terminal only).`;

const readJson = (file: string) => JSON.parse(readFileSync(file, "utf8"));

/** The public packages of this repository, by npm name: `@nanoforge-dev/editor-lib` → `modules/editor`. */
export const localPackages = (root = ROOT): Map<string, string> => {
  const packages = new Map<string, string>();
  for (const folder of PACKAGE_FOLDERS)
    for (const entry of readdirSync(join(root, folder))) {
      const file = join(root, folder, entry, "package.json");
      if (!existsSync(file)) continue;
      const pkg = readJson(file);
      if (!pkg.private) packages.set(pkg.name, join(root, folder, entry));
    }
  return packages;
};

/** The examples of a checkout: the folders of `basics/`, `demos/` and `games/` holding a `package.json`. */
export const listExamples = (checkout: string): Example[] =>
  GROUPS.filter((group) => existsSync(join(checkout, group))).flatMap((group) =>
    readdirSync(join(checkout, group))
      .filter((name) => existsSync(join(checkout, group, name, "package.json")))
      .map((name) => ({ id: `${group}/${name}`, name, dir: join(checkout, group, name) })),
  );

/** Picks examples by `name` or `group/name`; throws on an unknown or ambiguous one. */
export const pickExamples = (examples: Example[], wanted: string[]): Example[] =>
  wanted.map((want) => {
    const found = examples.filter((example) => example.id === want || example.name === want);
    const [only, ...others] = found;
    if (only && others.length === 0) return only;
    if (!only)
      throw new Error(`Unknown example "${want}". Known: ${examples.map((e) => e.id).join(", ")}`);
    throw new Error(`"${want}" is ambiguous: use ${found.map((e) => e.id).join(" or ")}`);
  });

const packageFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return packageFiles(path);
    return entry === "package.json" ? [path] : [];
  });

/**
 * Copies an example to `dest` (replacing a previous copy) without its installs, builds and lockfile,
 * then points every dependency on a local package at it with `link:`.
 */
export const copyExample = (example: Example, dest: string, packages: Map<string, string>) => {
  rmSync(dest, { recursive: true, force: true });
  // Dereferenced: a link into the checkout would let the copy write to the real game.
  cpSync(example.dir, dest, {
    recursive: true,
    dereference: true,
    filter: (src) => !SKIPPED.has(basename(src)),
  });
  // Its own workspace root, so pnpm never installs it into this repository's workspace.
  if (!existsSync(join(dest, "pnpm-workspace.yaml")))
    writeFileSync(
      join(dest, "pnpm-workspace.yaml"),
      "packages:\n  - apps/*\nallowBuilds:\n  bun: true\n",
    );
  // shortcut: only direct dependencies are linked; a published package depending on the engine
  // still gets its own copy. Add `overrides` to the copy's pnpm-workspace.yaml if an example needs it.
  for (const file of packageFiles(dest)) {
    const pkg = readJson(file);
    for (const field of DEPENDENCY_FIELDS)
      for (const name of Object.keys(pkg[field] ?? {}))
        if (packages.has(name)) pkg[field][name] = `link:${packages.get(name)}`;
    writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
  }
};

const findCheckout = async (from: string | undefined): Promise<string> => {
  const candidate = from ?? process.env.NANOFORGE_EXAMPLES ?? join(ROOT, "..", "examples");
  if (existsSync(candidate)) return resolve(candidate);
  if (from ?? process.env.NANOFORGE_EXAMPLES)
    throw new Error(`No examples checkout at ${candidate}`);
  if (!process.stdin.isTTY) throw new Error(`No examples checkout found.\n\n${USAGE}`);
  const answer = await input({
    message: "Path to your NanoForge examples checkout:",
    validate: (value) => existsSync(value) || "No folder there",
  });
  return resolve(answer);
};

const main = async () => {
  const { values } = parseArgs({
    options: {
      from: { type: "string" },
      games: { type: "string" },
      all: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });
  if (values.help) return console.log(USAGE);

  const checkout = await findCheckout(values.from);
  const examples = listExamples(checkout);
  if (examples.length === 0) throw new Error(`No example in ${checkout} (basics/, demos/, games/)`);

  let chosen: Example[];
  if (values.all) chosen = examples;
  else if (values.games) chosen = pickExamples(examples, values.games.split(","));
  else if (process.stdin.isTTY)
    chosen = await checkbox({
      message: "Examples to copy",
      choices: examples.map((example) => ({ name: example.id, value: example })),
      required: true,
    });
  else throw new Error(USAGE);

  const packages = localPackages();
  const unbuilt = [...packages].filter(
    ([name, dir]) => !name.startsWith("@nanoforge-dev/utils-") && !existsSync(join(dir, "dist")),
  );
  if (unbuilt.length > 0)
    throw new Error(`Run pnpm build first: ${unbuilt.map(([name]) => name).join(", ")} not built`);

  for (const example of chosen) {
    const dest = join(COPY_ROOT, example.id);
    console.log(`\n${example.id} → ${dest}`);
    copyExample(example, dest, packages);
    execFileSync("pnpm", ["install", "--no-frozen-lockfile"], { cwd: dest, stdio: "inherit" });
  }
  console.log(`\nDone. In a copy: pnpm build && pnpm start (or pnpm dev).`);
};

if (import.meta.main)
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
