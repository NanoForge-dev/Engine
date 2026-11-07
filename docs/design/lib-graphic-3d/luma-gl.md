---
title: "luma.gl"
icon: "cube"
description: "luma.gl in the 3D graphics library benchmark: verdict and evidence per criterion"
---

Part of the [3D graphics library benchmark](./index). Scores: ✅ meets, ⚠️ partly, ❌ does not, ❓ unknown.

|            |                                                                                                                  |
| ---------- | ---------------------------------------------------------------------------------------------------------------- |
| Packages   | `@luma.gl/core`, `@luma.gl/webgpu`, `@luma.gl/webgl`, `@luma.gl/engine`, `@luma.gl/shadertools`, `@math.gl/core` |
| Version    | 9.4.2 (`@math.gl/core` 4.1.0)                                                                                    |
| License    | MIT                                                                                                              |
| Repository | [visgl/luma.gl](https://github.com/visgl/luma.gl)                                                                |
| Result     | Eliminated (D2)                                                                                                  |
| Totals     | ✅ 10 · ⚠️ 12 · ❌ 5 · ❓ 3                                                                                      |

## Verdict

- A GPU abstraction layer more than a 3D engine: no built-in lit material, shaders are hand-written in both WGSL and GLSL.
- The best fit for our ECS (no entity system, no render loop, light `Model` objects) and the lightest bundle.
- Eliminated on D2: no transform gizmo. The editor would also need its own CPU raycast and world to screen projection.
- About 90% of commits come from one person; most downloads come from deck.gl, not standalone 3D use.

## Integration notes

- `__init`: `await luma.createDevice({ type: 'best-available', adapters: [webgpuAdapter, webgl2Adapter], createCanvasContext: { canvas } })`.
- `__clear`: `device.destroy()`, then delete the `globalThis.luma`, `mathgl`, `probe` and `Probe` globals set on import.
- `@math.gl/core` alone (8.7 KB gzip) works in Node and could serve shared components whatever the renderer.

## Evidence

| Id  | Score | Evidence                                                                                                                                                     |
| --- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A1  | ✅    | `luma.createDevice({ type: 'best-available', adapters: [webgpuAdapter, webgl2Adapter] })`. [Docs](https://luma.gl/docs/api-guide/background/webgpu-vs-webgl) |
| A2  | ⚠️    | No compute or storage buffers on WebGL2; 9.4 shadows are WebGPU only.                                                                                        |
| A3  | ❌    | App shaders need WGSL and GLSL; the Slang transpiler is still alpha.                                                                                         |
| A4  | ✅    | WebGL2 everywhere, WebGPU where available.                                                                                                                   |
| B1  | ❓    | Not measured; no 3D scene benchmark.                                                                                                                         |
| B2  | ⚠️    | Measured 399 KB raw, 112 KB gzip, without any built-in lit material (hand-written shaders).                                                                  |
| B3  | ❓    | Async `createDevice`. Not measured.                                                                                                                          |
| B4  | ⚠️    | Canvas type accepts `OffscreenCanvas`; no worker docs.                                                                                                       |
| C1  | ✅    | `createCanvasContext` with our canvas or container. [Docs](https://luma.gl/docs/api-reference/core/canvas-context)                                           |
| C2  | ✅    | No rAF in core; `AnimationLoop` is optional.                                                                                                                 |
| C3  | ⚠️    | `destroy()` APIs; import sets `globalThis.luma`, `mathgl`, `probe`, `Probe`.                                                                                 |
| C4  | ✅    | `autoResize`, `useDevicePixels`, `pixelSizeSource`.                                                                                                          |
| C5  | ✅    | Measured: `@math.gl/core` imports in Node 24 with no DOM (8.7 KB gzip).                                                                                      |
| C6  | ✅    | No entity system; `Model` per entity or optional `ScenegraphNode`.                                                                                           |
| D1  | ⚠️    | GPU picking only; no CPU raycast, world to screen by hand.                                                                                                   |
| D2  | ❌    | No transform gizmo.                                                                                                                                          |
| D3  | ✅    | `OrbitControls` in `@luma.gl/engine` 9.4.                                                                                                                    |
| D4  | ⚠️    | No scene format; glTF load and export only.                                                                                                                  |
| D5  | ⚠️    | No screenshot helper; `toBlob` right after `submit()`, untested.                                                                                             |
| D6  | ❓    | Not tested; the device belongs to the original window's `navigator.gpu`.                                                                                     |
| E1  | ⚠️    | 135 examples but low level: a hello cube needs hand-written WGSL and GLSL.                                                                                   |
| E2  | ❌    | No a11y features.                                                                                                                                            |
| E3  | ❌    | No colorblind or contrast features.                                                                                                                          |
| F1  | ✅    | MIT.                                                                                                                                                         |
| F2  | ⚠️    | Active (about 1,000 commits in 12 months), but about 90% from one person; downloads come mostly from deck.gl.                                                |
| F3  | ✅    | Written in TypeScript, detailed `.d.ts`.                                                                                                                     |
| F4  | ⚠️    | glTF with skin, morph and animation; Draco needs `@loaders.gl/draco` added.                                                                                  |
| G1  | ⚠️    | PBR and IBL; shadows only in `@luma.gl/experimental`, WebGPU only.                                                                                           |
| G2  | ❌    | No physics integration.                                                                                                                                      |
| G3  | ⚠️    | `TextRenderer`, no sprite or UI system.                                                                                                                      |
