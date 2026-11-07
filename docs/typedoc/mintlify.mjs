// TypeDoc plugin: turns typedoc-plugin-markdown output into Mintlify pages.
// - adds `title` and `description` frontmatter to every page;
// - writes `navigation.json` (Mintlify navigation items, paths relative to the output folder);
// - drops the root index page: the navigation starts with one group per package.
import { rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Comment, ReflectionKind } from "typedoc";
import { MarkdownPageEvent, MarkdownRendererEvent } from "typedoc-plugin-markdown";

const GROUP_NAMES = { "Type Aliases": "Type aliases", Enumerations: "Enums" };

const summaryOf = (model) => {
  const comment = model.comment ?? model.signatures?.[0]?.comment;
  if (!comment?.summary.length) return undefined;
  const text = Comment.combineDisplayParts(comment.summary).split(/\n\s*\n/)[0];
  return text.replace(/`/g, "").replace(/\s+/g, " ").trim() || undefined;
};

// A multi-entry package names its entry points after their file ("index", "client"...): show the import path instead.
const titleOf = (model) => {
  if (!model.kindOf?.(ReflectionKind.Module) || !model.parent?.kindOf(ReflectionKind.Module)) {
    return model.name;
  }
  return model.name === "index" ? model.parent.name : `${model.parent.name}/${model.name}`;
};

const frontmatter = (fields) =>
  Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join("\n");

const pagePath = (path) => path.replace(/\.mdx?$/, "");

const toMintlify = (item, parentTitle) => {
  if (!item.children?.length) return pagePath(item.path);
  const isEntryPoint = item.kind === ReflectionKind.Module && parentTitle;
  const group = isEntryPoint
    ? item.title === "index"
      ? parentTitle
      : `${parentTitle}/${item.title}`
    : (GROUP_NAMES[item.title] ?? item.title);
  const children = item.children
    .toSorted((a, b) => (b.title === "index") - (a.title === "index"))
    .map((child) => toMintlify(child, item.kind === ReflectionKind.Module ? group : undefined));
  return item.path
    ? { group, root: pagePath(item.path), pages: children }
    : { group, pages: children };
};

/** @param {import("typedoc-plugin-markdown").MarkdownApplication} app */
export const load = (app) => {
  app.renderer.on(MarkdownPageEvent.END, (page) => {
    if (!page.isReflectionEvent()) return;
    const fields = { title: titleOf(page.model), description: summaryOf(page.model) };
    page.contents = `---\n${frontmatter(fields)}\n---\n\n${page.contents}`;
  });

  app.renderer.on(MarkdownRendererEvent.END, (event) => {
    rmSync(join(event.outputDirectory, "index.mdx"), { force: true });
    const navigation = event.navigation.map((item) => toMintlify(item));
    writeFileSync(
      join(event.outputDirectory, "navigation.json"),
      `${JSON.stringify(navigation, null, 2)}\n`,
    );
  });
};
