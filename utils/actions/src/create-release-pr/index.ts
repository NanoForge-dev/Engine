import { getBooleanInput, getInput, summary } from "@actions/core";
import { program } from "commander";

import {
  checkoutToReleaseBranch,
  createPR,
  pushRelease,
  resolveChangelog,
  resolvePackage,
  resolveVersion,
  runRelease,
  updateVersion,
} from "./functions";

const createSummary = async (name: string, dry: boolean) => {
  const pkg = await resolvePackage(name);
  const changelog = await resolveChangelog(pkg.path, pkg.name, pkg.version);

  const result = summary.addHeading("Pre-Release summary");

  if (dry) {
    result.addRaw("\n\n> [!NOTE]\n> This is a dry run.\n\n");
  }

  result.addHeading(`${pkg.name} pre-released`, 2);

  result.addRaw(`> Version : ${pkg.version}\n`);
  result.addSeparator();
  result.addRaw("> Changelog :\n");
  result.addBreak();
  result.addCodeBlock(changelog);

  await result.write();
};

const bootstrap = async () => {
  program
    .name("create release pr")
    .description("pre-releases monorepo packages with proper sequencing")
    .argument(
      "[package]",
      "release a specific package (and it's dependencies)",
      getInput("package"),
    )
    .option("--dry", "skips actual publishing and outputs logs instead", getBooleanInput("dry"))
    .option("--version <version>", "new version of the package", getInput("version"))
    .parse();

  const { dry, version: baseVersion } = program.opts<{ dry: boolean; version: string }>();
  const [packageName] = program.processedArgs as [string];

  const pkg = await resolvePackage(packageName);
  const version = baseVersion || (await resolveVersion(packageName));

  const branchName = await checkoutToReleaseBranch(pkg.name, version);
  await updateVersion(pkg.path, version);
  await runRelease(pkg.name);
  if (!dry) {
    await pushRelease(branchName);
    await createPR(branchName);
  }

  await createSummary(packageName, dry);
};

bootstrap().then();
