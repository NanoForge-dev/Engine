<div align="center">
    <br />
    <p>
        <a href="https://github.com/NanoForge-dev"><img src="https://github.com/NanoForge-dev/Engine/blob/main/.github/logo.png" width="546" alt="NanoForge" /></a>
    </p>
    <br />
    <p>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/editor-lib"><img src="https://img.shields.io/npm/v/@nanoforge-dev/editor-lib.svg?maxAge=3600" alt="npm version" /></a>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/editor-lib"><img src="https://img.shields.io/npm/dt/@nanoforge-dev/editor-lib.svg?maxAge=3600" alt="npm downloads" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml"><img src="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml/badge.svg" alt="Tests status" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/commits/main/packages/editor"><img src="https://img.shields.io/github/last-commit/NanoForge-dev/Engine.svg?logo=github&logoColor=ffffff&path=packages%2Feditor" alt="Last commit" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/graphs/contributors"><img src="https://img.shields.io/github/contributors/NanoForge-dev/Engine.svg?maxAge=3600&logo=github&logoColor=fff&color=00c7be" alt="Contributors" /></a>
    </p>
</div>

## About

`@nanoforge-dev/editor-lib` is the bridge between a running NanoForge application and an external editor host. `EditorLibrary` turns the raw `toEditor`/`fromEditor` event-emitter pair supplied via `RunOptions.editor` into the `Context.editor` facade every other library sees, and handles the pause/resume/step/stop commands, run state reports, frame stats and log forwarding: see the [editor protocol](https://github.com/NanoForge-dev/Engine/blob/main/docs/docs/editor/protocol.mdx).

It also provides `QueuedEventEmitter`, the event emitter an editor host gives a game in `RunOptions.editor`.

## Installation

**Node.js 26 or newer is required.**

```sh
npm install @nanoforge-dev/editor-lib
yarn add @nanoforge-dev/editor-lib
pnpm add @nanoforge-dev/editor-lib
bun add @nanoforge-dev/editor-lib
```

## Example usage

Register `EditorLibrary` alongside your other libraries. It does nothing when no editor started the app:

```ts
import { EditorLibrary } from "@nanoforge-dev/editor-lib";

app.use(new EditorLibrary());
```

The editor host constructs one `QueuedEventEmitter` per direction and hands both to `RunOptions.editor`:

```ts
import { QueuedEventEmitter } from "@nanoforge-dev/editor-lib";

const toEditor = new QueuedEventEmitter(); // engine -> editor
const fromEditor = new QueuedEventEmitter(); // editor -> engine

await app.init({ ...options, editor: { toEditor, fromEditor } });
fromEditor.emit("pause");
```

Libraries talk to the editor through `Context.editor`, `undefined` when no editor started the game:

```ts
public override async __run(ctx: Context): Promise<void> {
  ctx.editor?.emit("component-moved", entityId, position);
}
```

One-time editor wiring goes in `__editorInit`, which `EditorLibrary` calls once on every library that has it, when the editor's `welcome` arrives:

```ts
import type { EditorAwareLibrary, EditorInitContext } from "@nanoforge-dev/editor-lib";

class MyLibrary extends Library implements EditorAwareLibrary {
  public async __editorInit(ctx: EditorInitContext): Promise<void> {
    ctx.editor.on("hot-reload", (entity, component) => this.apply(entity, component));
  }
}
```

## Links

- [GitHub][source]
- [npm][npm]

## Contributing

Before creating an issue, please ensure that it hasn't already been reported/suggested, and double-check the
[documentation][documentation].  
See [the contribution guide][contributing] if you'd like to submit a PR.

## Help

If you don't understand something in the documentation, you are experiencing problems, or you just need a gentle nudge in the right direction, please don't hesitate to ask questions in [discussions][discussions].

[documentation]: https://github.com/NanoForge-dev/Engine
[discussions]: https://github.com/NanoForge-dev/Engine/discussions
[source]: https://github.com/NanoForge-dev/Engine/tree/main/packages/editor
[npm]: https://www.npmjs.com/package/@nanoforge-dev/editor-lib
[contributing]: https://github.com/NanoForge-dev/Engine/blob/main/.github/CONTRIBUTING.md
