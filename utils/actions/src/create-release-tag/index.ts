import { getInput } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { program } from "commander";
import process from "node:process";

let octokit: ReturnType<typeof getOctokit> | undefined;

if (process.env.GITHUB_TOKEN) {
  octokit = getOctokit(process.env.GITHUB_TOKEN);
}

const bootstrap = async () => {
  program
    .name("create release tag")
    .description("create release tag for monorepo packages with proper sequencing")
    .option("--commit <commit>", "commit sha of ythe last commit", getInput("commit"))
    .option("--branch <branch>", "head branch of the merged pr", getInput("branch"))
    .parse();

  const { commit, branch } = program.opts<{ commit: string; branch: string }>();

  const pkg = branch.replace("releases/", "@nanoforge-dev/");

  await octokit?.rest.git.createRef({
    ...context.repo,
    ref: `refs/tags/${pkg}`,
    sha: commit,
  });
};

bootstrap().then();
