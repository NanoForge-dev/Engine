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

`@nanoforge-dev/editor-lib` is the built-in bridge library between a running NanoForge application and an external editor host. It turns the raw `toEditor`/`fromEditor` event-emitter pair supplied via `RunOptions.editor` into the single, asymmetric `Context.editor` facade every other library sees.

## Installation

**Node.js 26 or newer is required.**

```sh
npm install @nanoforge-dev/editor-lib
yarn add @nanoforge-dev/editor-lib
pnpm add @nanoforge-dev/editor-lib
bun add @nanoforge-dev/editor-lib
```

## Warning

This library is opt-in — only register it when the app is started under an editor host (`app.use(new EditorLibrary())`). Without it, `Context.editor` is simply absent, and other libraries that check for it (like `@nanoforge-dev/ecs`'s hot-reload wiring) no-op cleanly.

## Example usage

Construct one `QueuedEventEmitter` per direction and hand both to `RunOptions.editor` when starting the app:

```ts
import { QueuedEventEmitter } from "@nanoforge-dev/editor-lib";

const toEditor = new QueuedEventEmitter(); // engine -> editor
const fromEditor = new QueuedEventEmitter(); // editor -> engine

await app.init({
  ...options,
  editor: { toEditor, fromEditor },
});
```

Register `EditorLibrary` alongside your other libraries:

```ts
import { EditorLibrary } from "@nanoforge-dev/editor-lib";

app.use(new EditorLibrary());
```

Any registered library can then talk to the editor through `Context.editor`:

```ts
public override async __run(ctx: Context): Promise<void> {
  ctx.editor?.emit("component-moved", entityId, position);
}
```

The editor host itself drives the other two operations directly on the raw emitters it created — sending commands via `fromEditor.emit(...)` and listening for outgoing notifications via `toEditor.on(...)` — which is why `Context.editor` only exposes `emit`/`on` for the reverse direction, not all four.

## Base commands

`EditorLibrary` handles three reserved editor → engine commands itself, with no app-side wiring required — they're forwarded straight to `Context.app`'s pause/resume/stop actions:

```ts
import { EditorCommand } from "@nanoforge-dev/editor-lib";

fromEditor.emit(EditorCommand.Pause); // ctx.app.requestPause()
fromEditor.emit(EditorCommand.Resume); // ctx.app.requestResume()
fromEditor.emit(EditorCommand.Stop); // ctx.app.requestStop()
```

Because `EditorLibrary` drains `fromEditor` from `__events` (which keeps running even while paused), a queued `EditorCommand.Resume` always reaches the engine and lifts the pause — it isn't blocked behind the very pause it's meant to undo.

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
