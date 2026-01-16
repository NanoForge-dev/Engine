import { context, getOctokit } from "@actions/github";
import { $, file, write } from "bun";
import process from "node:process";
import { join } from "path";

import { type IPkg } from "./types";

let octokit: ReturnType<typeof getOctokit> | undefined;

if (process.env.GITHUB_TOKEN) {
  octokit = getOctokit(process.env.GITHUB_TOKEN);
}

export const resolvePackage = async (name: string): Promise<IPkg> => {
  const pkgs: IPkg[] =
    await $`pnpm list --filter ${name} --recursive --only-projects --prod --json`.json();
  if (pkgs.length <= 0) throw new Error("Package not found");
  return pkgs[0] as IPkg;
};

export const resolveChangelog = async (
  path: string,
  name: string,
  version: string,
): Promise<string> => {
  const changelogFile = await file(join(path, "CHANGELOG.md")).text();
  let changelogLines: string[] = [];
  let foundChangelog = false;

  for (const line of changelogFile.split("\n")) {
    if (line.startsWith("# [")) {
      if (foundChangelog) {
        if (changelogLines.at(-1) === "") changelogLines = changelogLines.slice(2, -1);
        break;
      }
      if (!line.startsWith(`# [${name}@${version}]`)) break;
      foundChangelog = true;
    }
    if (foundChangelog) changelogLines.push(line);
  }

  return `${changelogLines.join("\n").replace(/^\s+|\s+$/g, "")}\n`;
};

export const resolveVersion = async (name: string): Promise<string> => {
  const regex = new RegExp(`^📦 Bumped ${name}@(\\d+\\.\\d+\\.\\d+)$`);
  const res = await $`pnpm --filter=${name} run release --dry-run`.text();
  for (const line of res.split("\n")) {
    const match = regex.exec(line);
    if (match) return match[1] as string;
  }
  throw new Error("Could not find the version");
};

export const checkoutToReleaseBranch = async (name: string, version: string): Promise<string> => {
  const branchName = `releases/${name.replace("@nanoforge-dev/", "")}@${version}`;
  await $`git checkout -b ${branchName}`;
  return branchName;
};

export const updateVersion = async (path: string, version: string): Promise<void> => {
  const fullPath = join(path, "package.json");
  const pkg = await file(fullPath).json();
  pkg.version = version;
  await write(fullPath, JSON.stringify(pkg));
};

export const runRelease = async (name: string): Promise<void> => {
  await $`pnpm --filter=${name} run release --skip-automatic-bump --skip-tag`;
};

export const pushRelease = async (branch: string): Promise<void> => {
  await $`git push origin refs/heads/${branch}:${branch}`;
};

export const createPR = async (branchName: string): Promise<void> => {
  await octokit?.rest.pulls.create({
    ...context.repo,
    base: "main",
    head: branchName,
    title: await $`git show -s --format=%s`.text(),
  });
};
