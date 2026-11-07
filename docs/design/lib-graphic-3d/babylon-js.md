---
title: "Babylon.js"
icon: "cube"
description: "Babylon.js in the 3D graphics library benchmark: verdict, integration notes and evidence per criterion"
---

Part of the [3D graphics library benchmark](./index). Scores: ✅ meets, ⚠️ partly, ❌ does not, ❓ unknown.

|            |                                                                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Package    | `@babylonjs/core` (ES packages), plus `@babylonjs/loaders`, `@babylonjs/gui`, `@babylonjs/havok`, `@babylonjs/accessibility` as needed |
| Version    | 9.34.0                                                                                                                                 |
| License    | Apache-2.0                                                                                                                             |
| Repository | [BabylonJS/Babylon.js](https://github.com/BabylonJS/Babylon.js)                                                                        |
| Result     | Finalist, first                                                                                                                        |
| Totals     | ✅ 23 · ⚠️ 6 · ❌ 1 · ❓ 0                                                                                                             |

## Verdict

- The only library with something for player a11y: `@babylonjs/accessibility` mirrors tagged meshes as HTML for screen readers and keyboard navigation.
- Everything the editor needs is in core: picking, `GizmoManager`, editor cameras, scene serialization, a screenshot API.
- Clean engine integration: no hidden loop, no global left on `window`, types shipped, official Havok physics.
- Weak points: the bundle (424 KB gzip, 191 KB first chunk with code splitting), and in the POC its WebGPU backend was the slowest with 20,000 unbatched meshes (5.3 FPS, against 24.9 FPS on WebGL).

## Integration notes

- `__init`: `await EngineFactory.CreateAsync(canvas, {})` (WebGPU, then WebGL), or `new WebGPUEngine(canvas)` + `await initAsync()` with a WebGL `Engine` fallback.
- Tick: do not call `runRenderLoop`. Wrap each frame in `engine.beginFrame()`, `scene.render()`, `engine.endFrame()`: without them WebGPU never submits its commands and `CreateScreenshotAsync` never resolves (found in the POC).
- Viewport: `engine.setSize`, `setHardwareScalingLevel(1 / pixelRatio)`, camera `viewport` for the letterbox.
- `__clear`: `scene.dispose()`, `engine.dispose()`. Nothing to delete on `window`.
- Many entities: use instances or thin instances rather than `clone()` (3.1 s to set up 20,000 clones in the POC).

## Evidence

| Id  | Score | Evidence                                                                                                                                                                                                                            |
| --- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | ✅    | `EngineFactory.CreateAsync` tries WebGPU, then WebGL, then `NullEngine`. [Docs](https://doc.babylonjs.com/setup/support/webGPU)                                                                                                     |
| A2  | ⚠️    | Shadows, post-process and PBR on both; compute shaders are WebGPU only. [Status](https://doc.babylonjs.com/setup/support/webGPU/webGPUStatus)                                                                                       |
| A3  | ✅    | Built-in materials and `NodeMaterial` emit GLSL and WGSL; hand-written shaders need both. [Docs](https://doc.babylonjs.com/setup/support/webGPU/webGPUWGSL)                                                                         |
| A4  | ✅    | WebGPU where available; WebGL2/1 fallback for mobile and older browsers.                                                                                                                                                            |
| B1  | ⚠️    | POC: 60 FPS (vsync cap) with 2,000 meshes; with 20,000 unbatched meshes 24.9 FPS on WebGL but 5.3 FPS on WebGPU (p95 340 ms). See [POC](./poc).                                                                                     |
| B2  | ❌    | Measured 1.81 MB raw, 424 KB gzip (WebGPU + fallback, deep imports). WebGL only: 344 KB. Code splitting: 191 KB first chunk.                                                                                                        |
| B3  | ⚠️    | POC: about 345 ms to the first frame with 2,000 meshes, about 3.1 s with 20,000 (`clone()` per mesh). See [POC](./poc).                                                                                                             |
| B4  | ✅    | OffscreenCanvas in a worker is documented. [Docs](https://doc.babylonjs.com/features/featuresDeepDive/scene/offscreenCanvas)                                                                                                        |
| C1  | ✅    | `new Engine(canvas)` / `new WebGPUEngine(canvas)` takes our canvas.                                                                                                                                                                 |
| C2  | ✅    | `runRenderLoop` is opt-in; from our tick call `engine.beginFrame()`, `scene.render()`, `engine.endFrame()` (POC: without them WebGPU never submits and screenshots never resolve).                                                  |
| C3  | ✅    | `scene.dispose()` and `engine.dispose()`; POC: no global left on `window` in the browser (ES packages; only the UMD build sets `window.BABYLON`).                                                                                   |
| C4  | ✅    | `engine.resize()`, `setHardwareScalingLevel()`, `adaptToDeviceRatio`, camera `viewport`.                                                                                                                                            |
| C5  | ✅    | Measured: `Maths/math.vector.js` imports and computes in Node 24 with no DOM.                                                                                                                                                       |
| C6  | ⚠️    | No entity system imposed, but `TransformNode`/`Mesh` are heavy OOP objects.                                                                                                                                                         |
| D1  | ✅    | `scene.pick(x, y)`, `createPickingRay`, `Vector3.Project`. [Docs](https://doc.babylonjs.com/features/featuresDeepDive/mesh/interactions/picking_collisions)                                                                         |
| D2  | ✅    | `GizmoManager` in core: position, rotation, scale, bounding box. [Docs](https://doc.babylonjs.com/features/featuresDeepDive/mesh/gizmo)                                                                                             |
| D3  | ✅    | ArcRotate, Universal and Free cameras; `scene.activeCamera` switch.                                                                                                                                                                 |
| D4  | ✅    | `SceneSerializer`, `.babylon` JSON, `AssetContainer`. [Docs](https://doc.babylonjs.com/setup/support/.babylonFileFormat)                                                                                                            |
| D5  | ✅    | POC: `CreateScreenshotAsync` and `canvas.toDataURL()` give a painted PNG on both backends, once frames are wrapped in `beginFrame`/`endFrame`.                                                                                      |
| D6  | ✅    | POC: the canvas moved into another document (iframe) keeps rendering on both backends, no error. A real `window.open` window is not tested.                                                                                         |
| E1  | ✅    | Large docs and a Playground with thousands of samples; hello cube and glTF in about 10 lines each. [Playground](https://playground.babylonjs.com)                                                                                   |
| E2  | ⚠️    | `@babylonjs/accessibility` mirrors tagged meshes as HTML for screen readers and keyboard navigation; no reduced-motion support. [Docs](https://doc.babylonjs.com/features/featuresDeepDive/accessibility/accessibilityScreenReader) |
| E3  | ⚠️    | Image processing and custom post-process, no built-in colorblind filter; GUI scales with `idealWidth`.                                                                                                                              |
| F1  | ✅    | Apache-2.0; Havok plugin MIT; no SaaS.                                                                                                                                                                                              |
| F2  | ✅    | 26k stars, about 1,700 commits and 100+ releases in 12 months, 369k npm downloads per week.                                                                                                                                         |
| F3  | ✅    | Written in TypeScript, ships `.d.ts`.                                                                                                                                                                                               |
| F4  | ✅    | glTF via `@babylonjs/loaders`; KTX2/Basis, Draco, meshopt, skeletal and morph animation.                                                                                                                                            |
| G1  | ✅    | `PBRMaterial`, cascaded shadows, IBL.                                                                                                                                                                                               |
| G2  | ✅    | Physics v2 with the official Havok plugin (`@babylonjs/havok`).                                                                                                                                                                     |
| G3  | ✅    | `@babylonjs/gui`, sprites, text; Konva on top with a transparent `clearColor`.                                                                                                                                                      |
