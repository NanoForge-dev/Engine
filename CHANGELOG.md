# Changelog

All notable changes to this project will be documented in this file.

# [2.0.0](https://github.com/NanoForge-dev/Engine/compare/@nanoforge-dev/nanoforge@1.4.2...@nanoforge-dev/nanoforge@2.0.0) - (2026-09-27)

NanoForge 2.0 rewrites the engine. It replaces the typed "library slot" system (`useGraphics`, `useNetwork`, `ctx.libs.getX()`…) with one generic `app.use(library)` API and a typed `Context` object that each library extends. It also merges the client/server/lib package triplets into single modules with `/client` and `/server` entry points, moves networking to Bun, and adds an engine-owned viewport so games scale dynamically.

> ⚠️ **This is a breaking release.** Every game written against 1.x needs migration. See [Migration guide](#migration-guide) below.

---

## Highlights

- **New core API.** Register any library with `app.use(lib)`. Every library contributes its own key to a typed `Context` (`ctx.ecs`, `ctx.graphics`, `ctx.input`, `ctx.network`…).
- **Fewer packages.** 15 packages became 11. The engine infrastructure lives in `packages/` and the optional feature libraries live in `modules/`.
- **Single ECS module.** `@nanoforge-dev/ecs` with `/client` (web WASM) and `/server` (Node WASM) entry points.
- **Single network module.** `@nanoforge-dev/network` with `/client` and `/server`. It is built on `Bun.serve` and `node-datachannel` and uses session-based client identity shared between TCP and UDP.
- **Dynamic resize and viewport.** You set a design resolution with a `fill`/`contain`/`cover` fit mode. The engine tracks window, container, fullscreen and DPI changes, and graphics and input follow automatically.
- **New editor bridge.** `@nanoforge-dev/editor-lib` is an opt-in library with a queued event emitter. Pause, resume and stop work out of the box.
- **Pause support in core.** A new `__events` hook runs even while the game is paused.

---

## Breaking Changes

### Package map

| 1.x package                                                                        | 2.0 package                                        | Location              |
| ---------------------------------------------------------------------------------- | -------------------------------------------------- | --------------------- |
| `@nanoforge-dev/common`                                                            | `@nanoforge-dev/common` (rewritten)                | `packages/common`     |
| `@nanoforge-dev/core`                                                              | `@nanoforge-dev/core` (rewritten)                  | `packages/core`       |
| `@nanoforge-dev/asset-manager`                                                     | `@nanoforge-dev/asset` (built-in, auto-registered) | `packages/asset`      |
| `@nanoforge-dev/config`                                                            | `@nanoforge-dev/env`                               | `packages/env`        |
| `@nanoforge-dev/ecs-client`, `@nanoforge-dev/ecs-server`, `@nanoforge-dev/ecs-lib` | `@nanoforge-dev/ecs` (`/client`, `/server`)        | `modules/ecs`         |
| `@nanoforge-dev/network-client`, `@nanoforge-dev/network-server`                   | `@nanoforge-dev/network` (`/client`, `/server`)    | `modules/network`     |
| `@nanoforge-dev/core-editor`, `@nanoforge-dev/graphics-2d-editor`                  | `@nanoforge-dev/editor-lib`                        | `modules/editor`      |
| `@nanoforge-dev/graphics-2d`                                                       | `@nanoforge-dev/graphics-2d`                       | `modules/graphics-2d` |
| `@nanoforge-dev/input`                                                             | `@nanoforge-dev/input`                             | `modules/input`       |
| `@nanoforge-dev/sound`                                                             | `@nanoforge-dev/sound`                             | `modules/sound`       |
| `@nanoforge-dev/music`                                                             | `@nanoforge-dev/music`                             | `modules/music`       |

> **Note:** The name `@nanoforge-dev/config` no longer refers to the engine's env-validation package. In 2.0, that name belongs to the **NanoForge CLI** project-config package (`defineConfig`, used in `nanoforge.config.ts`). The env validators (`Default`, `IsIpOrURL`, `TransformToBoolean`, re-exported `class-validator`/`class-transformer`) now live in `@nanoforge-dev/env`.

### Runtime & tooling

- **Node.js 26** is now required (was 25). The package manager is **pnpm 12**.
- **The network server requires the Bun runtime.** `NetworkServerLibrary.__init` throws if `Bun` is undefined.
- The `wrtc`, `ws` and `@mapbox/node-pre-gyp` dependencies were removed and replaced by `node-datachannel`.
- Game projects now use the NanoForge CLI 2.x layout. `nanoforge.config.json` was replaced by `nanoforge.config.ts` (`defineConfig({ type: "workspace" | "client" | "server" })`). Client and server live in `apps/client` and `apps/server`, and the build output moved from `.nanoforge/{client,server}` to `apps/*/dist`.

### Core (`@nanoforge-dev/core`)

- **Removed:** `useAssetManager`, `useComponentSystem`, `useNetwork`, `useGraphics`, `useInput`, `useSound` and `use(symbol, library)`. **Use `app.use(library)` instead.** A library's identity is now its own `key`.
- `app.use()` throws `NfDuplicateLibraryException` when the key is already registered or reserved (`app`, `vars`, `assets`, `viewport`), and throws when called after `init()`.
- `init()` now takes `ClientRunOptions` / `ServerRunOptions` (formerly `IRunOptions`).
- The asset library is **registered automatically** and always available as `ctx.assets`. Do not register it yourself.
- `ConfigRegistry` / `context.config.registerConfig()` were removed. Validate env with `registerEnv(EnvClass, ctx.env)` from `@nanoforge-dev/env`.
- Only `NanoforgeFactory`, the `NanoforgeClient`/`NanoforgeServer` types and the `ApplicationOptions`/`ClientApplicationOptions` types are exported.

### Common (`@nanoforge-dev/common`)

- The whole library-manager layer was removed: `ctx.libs`, `LibraryHandle`, `BaseLibraryManager`/`ClientLibraryManager`, `RelationshipHandler`, the per-type abstract libraries (`BaseGraphicsLibrary`, `BaseNetworkLibrary`, `BaseComponentSystemLibrary`…) and their `I*Library` interfaces.
- Contexts were redesigned. The `ExecutionContext`/`ClearContext`/`LibraryContext`/`ApplicationContext` classes were replaced by the plain interfaces `Context`, `InitContext`, `AppContext`, `VarsContext` and `AssetContext`.
- `IRunOptions`/`IRunClientOptions` → `RunOptions` / `ClientRunOptions` / `ServerRunOptions`. `RunOptions` now carries `env` (raw env record) and an optional `editor: { toEditor, fromEditor }`.
- **Removed:** `NfConfigException` (replaced by `NfEnvValidationException` in `@nanoforge-dev/env`).
- **Added:** `NfDuplicateLibraryException`.

### ECS (`@nanoforge-dev/ecs`)

- `ECSClientLibrary` / `ECSServerLibrary` → `EcsLibrary`, imported from `@nanoforge-dev/ecs/client` or `@nanoforge-dev/ecs/server`.
- The registry is exposed as `ctx.ecs.registry`. The library's `registry` getter still works.
- `libecs.wasm` is now loaded from `/libecs.wasm` in the virtual file map and shipped next to the JS bundle of each entry point.
- The C++ WASM sources are unchanged. The `Registry`, `SparseArray`, `Entity`, `Component` and `System` APIs stay the same.

### Network (`@nanoforge-dev/network`)

- `@nanoforge-dev/network-client` → `@nanoforge-dev/network/client` (`NetworkClientLibrary`). `@nanoforge-dev/network-server` → `@nanoforge-dev/network/server` (`NetworkServerLibrary`). Both are exposed on `ctx.network`.
- **Client IDs are now strings (UUIDs)** instead of numbers. This affects `getConnectedClients()`, `sendToClient()` and the `getReceivedPackets()` map keys.
- A client connected over both TCP and UDP is now **a single session with a single ID**. After the first transport's `welcome` message, the second transport joins the same session by presenting a secret token.
- The server's TCP and UDP transports now run on `Bun.serve`. The server-side WebRTC implementation moved to `node-datachannel`.
- Accessing `ctx.network.tcp` / `.udp` throws if that transport is not configured.

### Editor (`@nanoforge-dev/editor-lib`)

- `core-editor` (the separate editor-flavoured `NanoforgeFactory`) was removed. Editor support is now an opt-in library: `app.use(new EditorLibrary())`, fed by `RunOptions.editor = { toEditor, fromEditor }`.
- Commands were renamed. `pause-game` → `pause`, `unpause-game` → `resume`, `stop-game` → `stop` (see the `EditorCommand` enum).
- **Removed:** the `hard-reload` command and the `Save` save-file type.
- `hot-reload` now carries `(entity, component)` and is applied by the ECS library through `registry.addComponent`. It no longer carries a full `Save`.
- `graphics-2d-editor` was removed. Drag-to-move for `DrawableCircle2D`/`DrawableRect2D`/`DrawableText2D` is now built into `Graphics2DLibrary`. It turns on automatically when both the editor and ECS libraries are registered, and emits `move-component`.

### Input (`@nanoforge-dev/input`)

- **Mouse and drag positions are now in game coordinates** (the viewport's design resolution) instead of container CSS pixels. Because every client always creates a viewport, this affects every client app.

---

## Features

### Core & Common

- **Generic library registration**: `app.use(library)` with key-based identity.
- **`defineLibraryKey()`** ties a library's runtime key to its `declare module "@nanoforge-dev/common" { interface Context { … } }` augmentation, so key collisions fail at compile time.
- **`Library.expose()`**: a library returns a plain object as its public `Context` surface, which keeps internals and lifecycle hooks private.
- **Ordering relationships**: libraries declare `dependencies` (init order), `runBefore` and `runAfter` (tick order). Circular dependencies and unknown keys throw.
- **New `__events` lifecycle hook**: it runs every tick, even while paused. Use it for event and message draining.
- **`ctx.app`** (`AppContext`): `isRunning`, `isPaused`, `delta` (ms since last tick, frozen while paused), `tickRate`, `requestStop()`, `requestPause()` and `requestResume()`.
- **`ctx.vars`** (`VarsContext`): a typed, dev-editable key/value store shared across libraries and game code.
- `InitContext` exposes `vars`, `env`, `files`, `container`, `viewport` and `editor` during `__init`.
- `ServerRunOptions` type (#433).

### Viewport & dynamic resize (#441)

- New `viewport` client option: `NanoforgeFactory.createClient({ viewport: { width, height, fit, background } })`. The defaults are 1920×1080, `contain` and `black`.
- Fit modes mirror CSS `object-fit`: `fill`, `contain` (letterboxed) and `cover` (cropped).
- **`ctx.viewport`** (client only): `state`, `screenToGame()`, `gameToScreen()`, `onChange()`, `setOptions()` and `refresh()`.
- Tracks window `resize`, `visualViewport`, `fullscreenchange`, container `ResizeObserver` and `devicePixelRatio` changes (monitor switch). Changes are batched into one recompute per animation frame.
- `computeViewport()` is exported from `@nanoforge-dev/common` as a pure, DOM-free function.
- **Graphics 2D** automatically resizes, scales, offsets and letterboxes/crops the Konva stage on every viewport change, and follows the pixel ratio.
- **Input** maps pointer positions through `ctx.viewport.screenToGame()`.

### Asset (`@nanoforge-dev/asset`)

- Built-in `AssetLibrary`, always available as `ctx.assets.getAsset(path)`. It returns an `NfFile` (`arrayBuffer`/`blob`/`bytes`/`formData`/`json`/`text`).
- Paths are normalized: duplicate slashes collapse, a leading slash is added and a trailing slash is stripped.

### Env (`@nanoforge-dev/env`)

- `registerEnv(EnvClass, env)` validates and hydrates a decorated env class from anywhere (a library's `__init` or the app's `main`). It throws `NfEnvValidationException`.
- Includes the `Default`, `IsIpOrURL` and `TransformToBoolean` decorators and re-exports `class-validator`/`class-transformer`.

### ECS (`@nanoforge-dev/ecs`)

- A single module with separate web and Node WASM builds (`lib/web`, `lib/node`).
- The editor manifest types `EditorComponentManifest` and `EditorSystemManifest` (which describe components and systems for the NanoForge Editor) are exported again from the new module (#432).
- Runs after `graphics` by default.

### Network (`@nanoforge-dev/network`)

- **`ctx.network.clients`** (server): `get(id)`, `list()`, `onConnect(listener)` and `onDisconnect(listener)`. A session starts when its first transport connects and ends when its last transport closes.
- **`ClientInfo` / `ConnectionInfo`**: per-transport remote address, port, family, `User-Agent`, `Origin`, query params and connection timestamps. They are available through `clients.get()` and `tcp/udp.getClientInfo()`.
- **`ctx.network.clientId`** (client): the session ID assigned by the server.
- Clients wait for the server's `welcome` message, with a 5 s timeout. If one transport fails to connect, the error is logged and initialization continues.
- New configuration (env):
  - `ICE_SERVERS` (client and server): STUN/TURN servers as a comma-separated list or a JSON `RTCIceServer[]` (use JSON for TURN credentials). It defaults to a built-in list of public STUN servers (Cloudflare, Google, Twilio, Nextcloud…).
  - `ICE_PORT` (server): a fixed UDP port for WebRTC, with ICE UDP multiplexing. This makes the server compatible with firewalls, port forwards and Kubernetes.
  - `ADVERTISE_IP` (server): the public IP written into host ICE candidates (for container, pod or NAT setups).
- `NetworkConfig`, `ClientConfigNetwork` and `ServerConfigNetwork` are exported.

### Editor (`@nanoforge-dev/editor-lib`)

- `EditorLibrary` exposes `ctx.editor.emit()` (engine → editor) and `ctx.editor.on()` (editor → engine). The API is deliberately one-directional in each case so libraries cannot impersonate the editor.
- `QueuedEventEmitter`: events are queued and drained at a controlled point each tick.
- The `pause`, `resume` and `stop` commands are wired to `ctx.app` automatically, and a paused app still processes `resume`.

### Input (`@nanoforge-dev/input`)

- Ported to the new library API and exposed as `ctx.input`. Runs after `graphics` by default.

### Sound / Music

- Ported to the new library API and exposed as `ctx.sound` / `ctx.music` (`load`, `play`, `mute`).

---

## Features

- Add nanoforge package (#431) ([6801e56](https://github.com/NanoForge-dev/Engine/commit/6801e5634a7d24bf93c92814631bb426d6d64755)) by @Exeloo
- Add new asset (#425) ([f2085dd](https://github.com/NanoForge-dev/Engine/commit/f2085dd88cc5103eea5b3e53dd5463c713d7eb4a)) by @Exeloo
- Add dynamic resize (#441) ([9464df3](https://github.com/NanoForge-dev/Engine/commit/9464df330d97d3f1a10e272e7e1126dd3ab9af64)) by @Exeloo
- Add server run options type (#433) ([8700ece](https://github.com/NanoForge-dev/Engine/commit/8700ece5cba4c5f1e093d4bc246785810f92a8fe)) by @Exeloo
- Add new common (#423) ([f58b8e2](https://github.com/NanoForge-dev/Engine/commit/f58b8e2fa2801898233a0e2b75f7625c5f7cb851)) by @Exeloo
- Add new core (#424) ([6efc442](https://github.com/NanoForge-dev/Engine/commit/6efc4429a887bdb65762b984702497faea911893)) by @Exeloo
- Add ecs editor manifest types (#432) ([373cd8f](https://github.com/NanoForge-dev/Engine/commit/373cd8f039ef1ba49dcdf8a0b7187b6d55cd9640)) by @Exeloo
- Add new editor lib (#420) ([bc747fc](https://github.com/NanoForge-dev/Engine/commit/bc747fc4fd1780cbf2f0c9c46f617015cc25c5c9)) by @Exeloo
# Changelog
All notable changes to this project will be documented in this file.
- Add new modules handling (#421) ([fb81953](https://github.com/NanoForge-dev/Engine/commit/fb81953b742346dd1028e25cd049f65add2f475e)) by @Exeloo
- **network:** Better network identification and better connection handling (#439) ([d7a5669](https://github.com/NanoForge-dev/Engine/commit/d7a566900a543cbf447645ef07e761166568d90d)) by @Tchips46
- Add new network (#419) ([f1f5c85](https://github.com/NanoForge-dev/Engine/commit/f1f5c8556bfd57cb92ae95bf913d8846a5df42d5)) by @Exeloo

## Refactor

- Change ecs to only one module (#417) ([c7998c3](https://github.com/NanoForge-dev/Engine/commit/c7998c3b3f1b0dfbdc4a4bdf8c24c3ccf2ec4931)) by @Exeloo
- **network:** Change node webrtc to bun node-datachannel (#436) ([b3752a0](https://github.com/NanoForge-dev/Engine/commit/b3752a084a28d5cba08101b990a8f808d09fb7e5)) by @Tchips46
# Changelog
All notable changes to this project will be documented in this file.

## Bug Fixes

- **ecs:** Change libecs.wasm asset path (#437) ([9e07466](https://github.com/NanoForge-dev/Engine/commit/9e0746605565f1feeab49e1c0b2bd2bf8daf2f61)) by @Tchips46
- **ecs:** Change tsdown config to add wasm import in js dist file (#435) ([c81e43c](https://github.com/NanoForge-dev/Engine/commit/c81e43cbbc437c8147ec063c14b2a4e89874ac73)) by @Exeloo

# [1.4.2](https://github.com/NanoForge-dev/Engine/compare/@nanoforge-dev/nanoforge@1.4.1...@nanoforge-dev/nanoforge@1.4.2) - (2026-07-06)

## Bug Fixes

- Change url protocols validation on isIpOrURL validator in network (#398) ([541dd16](https://github.com/NanoForge-dev/Engine/commit/541dd16e307e355288ec49ec7ae75566bb7fe2b5)) by @Exeloo
- **core-editor:** Reload event searching for entities (#396) ([eb07c7f](https://github.com/NanoForge-dev/Engine/commit/eb07c7f2fa7ea834c40c7f78517ee7104c85c9b0)) by @Tchips46

# [1.4.1](https://github.com/NanoForge-dev/Engine/compare/@nanoforge-dev/nanoforge@1.4.0...@nanoforge-dev/nanoforge@1.4.1) - (2026-07-06)

## Bug Fixes

- Change check for address from fqdn to url (#394) ([8823c59](https://github.com/NanoForge-dev/Engine/commit/8823c5911f8c5a673a96c32df9888b2dea4d6370)) by @Exeloo

# [1.4.0](https://github.com/NanoForge-dev/Engine/compare/@nanoforge-dev/nanoforge@1.3.1...@nanoforge-dev/nanoforge@1.4.0) - (2026-07-01)

## Bug Fixes

- Make get asset not throw if undefined (#385) ([c508d89](https://github.com/NanoForge-dev/Engine/commit/c508d893c4264645bd942261ee8bbdf3cea62323)) by @Exeloo
- **core-editor:** Run when don't paused (#377) ([09147d2](https://github.com/NanoForge-dev/Engine/commit/09147d2e71488c7028e1f5983f43d5ff724769ee)) by @Tchips46

## Documentation

- Add in code docs (#370) ([0146a0e](https://github.com/NanoForge-dev/Engine/commit/0146a0e3e7783c8f3bed9640ad3a452531791e0c)) by @Exeloo

## Features

- Add drag and drop on graphics (#380) ([afffa7a](https://github.com/NanoForge-dev/Engine/commit/afffa7afd1f51eba2d2cd0d96fe47e5db04ac534)) by @Exeloo
- Add assets handling (#383) ([cda797a](https://github.com/NanoForge-dev/Engine/commit/cda797a793ee5074cd43503e55a8dd348a516305)) by @Exeloo
- **core-editor:** Event listenner not runned if main loop is paused (#379) ([25053db](https://github.com/NanoForge-dev/Engine/commit/25053db388e277bc7e1181315f07249f121fcc94)) by @Tchips46
- **graphic-2d:** Destroy konva js in the lib clear (#372) ([e1ae678](https://github.com/NanoForge-dev/Engine/commit/e1ae678e7420eb20a2152fc110550b786877e7a5)) by @Tchips46
- **core-editor:** Implement events (#369) ([4ebf791](https://github.com/NanoForge-dev/Engine/commit/4ebf7911521b9114c9e8f4482bd59175fb35cf06)) by @Tchips46
- Indexed zipper (#378) ([208b330](https://github.com/NanoForge-dev/Engine/commit/208b330bfd358561fca259b03bebc50563022d35)) by @Tchips46
# Changelog
All notable changes to this project will be documented in this file.

# [1.3.1](https://github.com/NanoForge-dev/Engine/compare/@nanoforge-dev/nanoforge@1.3.0...@nanoforge-dev/nanoforge@1.3.1) - (2026-06-04)

## Documentation

- Setup new docs synchro action (#359) ([ff605f2](https://github.com/NanoForge-dev/Engine/commit/ff605f2b38a71f3f4b23707de2809da790e56c90)) by @MartinFillon

# [1.3.0](https://github.com/NanoForge-dev/Engine/tree/@nanoforge-dev/nanoforge@1.3.0) - (2026-05-26)

## Refactor

- **docs:** Migrate to mdx (#343) ([66f66a7](https://github.com/NanoForge-dev/Engine/commit/66f66a71fa0a50cf528645c0929702e973ba6178)) by @MartinFillon

## Features

- **input:** Add mouse input event in input library (#332) ([39c185d](https://github.com/NanoForge-dev/Engine/commit/39c185d935771ddeae6d293e3a6e6f4096de3cf2)) by @bill-h4rper
- Add core editor contribution ressources (#263) ([6c27bf0](https://github.com/NanoForge-dev/Engine/commit/6c27bf08b7d894d96940d2c572e224c01c48e374)) by @Exeloo

## Testing

- Add unit and e2e tests (#244) ([d593579](https://github.com/NanoForge-dev/Engine/commit/d593579f149370e1d4f32eec5cac5d251fc31f9c)) by @Exeloo

