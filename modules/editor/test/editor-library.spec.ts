import type { InitContext } from "@nanoforge-dev/common";
import { describe, expect, it } from "vitest";

import { EditorLibrary, QueuedEventEmitter } from "../src";

const initContext = (editor?: InitContext["editor"]): InitContext => ({
  vars: { get: () => undefined, set: () => undefined },
  env: {},
  files: new Map(),
  ...(editor ? { editor } : {}),
});

describe("EditorLibrary", () => {
  it("keeps the 'editor' key and runs before every other library", () => {
    const library = new EditorLibrary();
    expect(library.key).toBe("editor");
    expect(library.relationships.runAfter).toEqual(["*"]);
  });

  it("exposes nothing when no editor started the app", async () => {
    const library = new EditorLibrary();
    await library.__init(initContext());
    expect(library.expose()).toBeUndefined();
  });

  it("exposes the Context.editor facade when an editor started the app", async () => {
    const library = new EditorLibrary();
    const toEditor = new QueuedEventEmitter();
    await library.__init(initContext({ toEditor, fromEditor: new QueuedEventEmitter() }));
    const facade = library.expose()!;
    expect(facade.welcome).toBeUndefined();

    const received: unknown[][] = [];
    toEditor.on("pong", (...args) => received.push(args));
    facade.emit("pong", 1);
    toEditor.runEvents();
    expect(received).toEqual([[1]]);
  });
});
