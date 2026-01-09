import { info, warning } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { $ } from "bun";
import process from "node:process";

import type { ReleaseEntry } from "./generate-release-tree";

let octokit: ReturnType<typeof getOctokit> | undefined;

if (process.env.GITHUB_TOKEN) {
  octokit = getOctokit(process.env.GITHUB_TOKEN);
}

async function checkRegistry(release: ReleaseEntry) {
  // const res = await fetch(`https://registry.npmjs.org/${release.name}/${release.version}`);
  // return res.ok;
  console.log(release);
  return false;
}

async function gitTagAndRelease(release: ReleaseEntry, dry: boolean) {
  const tagName = `${release.name}@${release.version}`;

  console.log(dry);

  // if (dry) {
  //   info(`[DRY] Release would be "${tagName}", skipping release creation.`);
  //   return;
  // }

  try {
    await octokit?.rest.repos.createRelease({
      ...context.repo,
      tag_name: tagName,
      name: tagName,
      body: release.changelog ?? "",
      generate_release_notes: release.changelog === undefined,
      make_latest: "true",
    });
  } catch (error) {
    warning(`Failed to create github release: ${error}`);
  }
}

export async function releasePackage(
  release: ReleaseEntry,
  dry: boolean,
  devTag?: string,
  doGitRelease = !devTag,
) {
  // Sanity check against the registry first
  if (await checkRegistry(release)) {
    info(`${release.name}@${release.version} already published, skipping.`);
    return false;
  }

  if (dry) {
    info(`[DRY] Releasing ${release.name}@${release.version}`);
  } else {
    await $`pnpm --filter=${release.name} publish --provenance --no-git-checks ${devTag ? `--tag=${devTag}` : ""}`;
  }

  // && !devTag just to be sure
  if (doGitRelease && !devTag) await gitTagAndRelease(release, dry);

  if (dry) return true;

  const before = performance.now();

  // Poll registry to ensure next publishes won't fail
  await new Promise<void>((resolve, reject) => {
    const interval = setInterval(async () => {
      if (await checkRegistry(release)) {
        clearInterval(interval);
        resolve();
        return;
      }

      if (performance.now() > before + 5 * 60 * 1_000) {
        clearInterval(interval);
        reject(new Error(`Release for ${release.name} failed.`));
      }
    }, 15_000);
  });

  return true;
}
