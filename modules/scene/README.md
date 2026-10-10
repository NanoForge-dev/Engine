<div align="center">
    <br />
    <p>
        <a href="https://github.com/NanoForge-dev"><img src="https://github.com/NanoForge-dev/Engine/blob/main/.github/logo.png" width="546" alt="NanoForge" /></a>
    </p>
    <br />
    <p>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/scene"><img src="https://img.shields.io/npm/v/@nanoforge-dev/scene.svg?maxAge=3600" alt="npm version" /></a>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/scene"><img src="https://img.shields.io/npm/dt/@nanoforge-dev/scene.svg?maxAge=3600" alt="npm downloads" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml"><img src="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml/badge.svg" alt="Tests status" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/commits/main/modules/scene"><img src="https://img.shields.io/github/last-commit/NanoForge-dev/Engine.svg?logo=github&logoColor=ffffff&path=modules%2Fscene" alt="Last commit" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/graphs/contributors"><img src="https://img.shields.io/github/contributors/NanoForge-dev/Engine.svg?maxAge=3600&logo=github&logoColor=fff&color=00c7be" alt="Contributors" /></a>
    </p>
</div>

## About

`@nanoforge-dev/scene` is NanoForge's scene manager. Scenes are classes that set up part of the game when they are loaded (entities, systems…) and remove it when they are unloaded. They form a tree, and the manager keeps **vars** that scenes and systems share. It is exposed on `Context.scenes`.

## Installation

**Node.js 26 or newer is required.**

```sh
npm install @nanoforge-dev/scene
yarn add @nanoforge-dev/scene
pnpm add @nanoforge-dev/scene
bun add @nanoforge-dev/scene
```

## Example usage

A scene extends `Scene`, and names the scene it is loaded under with a static `parent`. Each load creates a new instance: keep what the scene creates in its fields and remove it in `unload`. The scene module knows nothing of the ECS: the scene calls it.

```ts
import type { Context } from "@nanoforge-dev/common";
import type { Entity } from "@nanoforge-dev/ecs/client";
import { Scene, type SceneLoadContext } from "@nanoforge-dev/scene";

/**
 * The game: the terrain, under every level.
 *
 * @scene
 * @side client
 */
export class Game extends Scene {
  override load(ctx: Context) {
    // spawn the terrain
  }
}

/**
 * First level: the player and the walls.
 *
 * @scene
 * @side client
 * @vars score
 */
export class Level1 extends Scene<{ seed: number }> {
  static override parent = Game;
  private _player?: Entity;

  override load(ctx: Context, { params }: SceneLoadContext<{ seed: number }>) {
    this._player = ctx.ecs.registry.spawnEntity();
    ctx.scenes.vars.init("score", 0);
  }

  override unload(ctx: Context) {
    if (this._player) ctx.ecs.registry.killEntity(this._player);
  }
}
```

Register `SceneLibrary` with the scene to start with:

```ts
import { SceneLibrary } from "@nanoforge-dev/scene";

app.use(new SceneLibrary({ initial: Level1, params: { seed: 1 } }));
```

Change scene from anywhere that has the context, such as a system:

```ts
ctx.scenes.load(ctx, Level2);
ctx.scenes.load(ctx, Pause, { parent: "current" }); // a pause menu over any scene
ctx.scenes.unload(ctx, Pause);
```

### Moving between scenes

Only one chain of scenes is loaded at a time, from a root scene to the current one. Loading a scene unloads the loaded scenes up to the deepest one it shares with the new scene's parents, then loads its missing parents and the scene itself:

| From `Game › Level1 › RoomA`, load | Unloaded        | Loaded   |
| ---------------------------------- | --------------- | -------- |
| `RoomB` (child of `RoomA`)         | nothing         | `RoomB`  |
| `Level1` (a parent)                | `RoomA`         | nothing  |
| `RoomC` (sibling, child of Level1) | `RoomA`         | `RoomC`  |
| `Level2` (child of `Game`)         | `RoomA, Level1` | `Level2` |

Scenes are unloaded deepest first and loaded root first. Only the scene asked for gets the `params`; the parents loaded along with it get `undefined`. `parent` loads a scene under another parent for that load, or under the current scene with `"current"`.

Changes are queued, and made when no system runs: before the systems of the next tick, or right after the systems of the tick they were asked in. `load` and `unload` return a promise resolved once the change is made. When a scene's hook throws, the promise is rejected and the error stops the tick, like a system's. When the game stops, the scenes are dropped without calling `unload`: the other libraries are cleared by then.

### Vars

`ctx.scenes.vars` holds values shared by scenes and systems:

```ts
ctx.scenes.vars.init("score", 0); // only when "score" does not exist yet
ctx.scenes.vars.set("score", (ctx.scenes.vars.get("score") ?? 0) + 1);
ctx.scenes.vars.has("score");
ctx.scenes.vars.remove("score");
ctx.scenes.vars.init("best", 0, { persistent: true });
```

A var belongs to the scene that made it (with `init`, or `set` on a missing key): the scene being loaded or unloaded at the time, or else the current scene. It is removed when that scene is unloaded, unless it is `persistent`. Type your vars by augmenting `SceneVars`:

```ts
declare module "@nanoforge-dev/scene" {
  interface SceneVars {
    score: number;
  }
}
```

### Scene ids

Give `SceneLibrary` every scene class of the game, by id:

```ts
app.use(new SceneLibrary({ initial: Menu, scenes: { Menu, Run, Level1, Pause } }));
```

The keys are the scenes' ids (`SceneLoadContext.id`, and the names the editor uses). A bundler can rename a class, never these keys. A scene missing from `scenes` is known by its class name.

### Entities and systems

The scene module does not depend on the ECS. `EcsScene` (`@nanoforge-dev/ecs/scene`) is a scene whose `setup` spawns entities and adds systems, removed when it is unloaded.

### In the editor

When the NanoForge editor runs the game (`@nanoforge-dev/editor-lib`), the library sends a `scenes` event (the loaded scenes, the vars and the known ids) while the editor asks for it, and loads, unloads and sets vars on its `scenes-load`, `scenes-unload` and `scenes-set-var` commands.

### Documenting scenes for the editor

Document a scene like a component or a system, with a TSDoc comment:

- `@scene` marks the class as a scene;
- `@side` is `client`, `server` or `shared`;
- `@vars` lists the vars it inits or reads.

Its parent is read from `static parent`, and its params from its type argument (`Scene<{ seed: number }>`): document their fields with TSDoc.

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
[source]: https://github.com/NanoForge-dev/Engine/tree/main/modules/scene
[npm]: https://www.npmjs.com/package/@nanoforge-dev/scene
[contributing]: https://github.com/NanoForge-dev/Engine/blob/main/.github/CONTRIBUTING.md
