---
title: "3D benchmark POC"
icon: "flask"
description: "In-browser proof of concept for the two finalists, Three.js and Babylon.js"
---

In-browser proof of concept for the two finalists of the [3D graphics library benchmark](./index): [Three.js](./three-js) and [Babylon.js](./babylon-js). It fills the criteria that docs alone could not answer: B1, B3, D5, D6, and checks C2 and C3 in a real browser.

Run on 2026-11-05.

## Setup

- **Machine:** Apple M5, macOS.
- **Browser:** Chrome 153, headless, with `--enable-unsafe-webgpu` and background throttling disabled, driven by Playwright.
- **Versions:** `three` 0.187.0, `@babylonjs/core` 9.34.0.
- **Runs:** 3 per configuration, medians reported. Spot checks in a visible 120 Hz browser gave the same results.

## Scene

The same scene in both libraries:

- an 800×600 canvas;
- a perspective camera, an ambient (hemispheric) light and a directional light;
- N boxes sharing one geometry and one PBR material (`MeshStandardMaterial` / `PBRMetallicRoughnessMaterial`), on a grid;
- every frame, each box gets a new rotation, then the scene renders.

The frame is rendered from our own `requestAnimationFrame` loop, which stands for the engine tick: Babylon's `runRenderLoop` is not used. Meshes are plain objects, without instancing or batching, which is what a naive ECS sync would produce.

## Tests

| Id  | Test                                                                                                                                                           |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B3  | Time from creating the renderer to the first frame shown (two `requestAnimationFrame` after the first render). Library import time is excluded.                |
| B1  | Frame time over 5 seconds: average FPS and 95th percentile. N = 2,000 (a small game) and N = 20,000 (stress).                                                  |
| D5  | PNG right after a render, with `canvas.toDataURL()` and the library's own API (Babylon `CreateScreenshotAsync`), checked to contain more than the clear color. |
| D6  | The canvas is moved with `adoptNode` into a same-origin iframe (another document, as in a pop-out window) and renders 10 more frames; then a PNG is checked.   |
| C3  | After dispose, the list of `window` keys added since before the import.                                                                                        |

## Results

| Library    | Backend | N      | Init (ms) | FPS  | p95 frame (ms) | D5 capture | D6 other document | Globals left |
| ---------- | ------- | ------ | --------- | ---- | -------------- | ---------- | ----------------- | ------------ |
| Three.js   | WebGPU  | 2,000  | 57        | 60.1 | 16.8           | ✅         | ✅                | `__THREE__`  |
| Three.js   | WebGL   | 2,000  | 58        | 60.0 | 17.3           | ✅         | ✅                | `__THREE__`  |
| Babylon.js | WebGPU  | 2,000  | 348       | 59.5 | 17.2           | ✅         | ✅                | none         |
| Babylon.js | WebGL   | 2,000  | 341       | 59.9 | 17.2           | ✅         | ✅                | none         |
| Three.js   | WebGPU  | 20,000 | 367       | 11.7 | 90.5           | ✅         | ✅                | `__THREE__`  |
| Three.js   | WebGL   | 20,000 | 327       | 12.4 | 83.9           | ✅         | ✅                | `__THREE__`  |
| Babylon.js | WebGPU  | 20,000 | 3,129     | 5.3  | 340.3          | ✅         | ✅                | none         |
| Babylon.js | WebGL   | 20,000 | 3,064     | 24.9 | 40.3           | ✅         | ✅                | none         |

Headless Chrome caps at 60 FPS, so 2,000 meshes run at the cap for both. In the visible browser (120 Hz) they ran at 120 FPS for both.

## Findings

- **B1:** with 2,000 meshes both reach the display rate. With 20,000 unbatched meshes neither is playable: Three.js gives about 12 FPS on both backends, Babylon.js 25 FPS on WebGL but 5 FPS on WebGPU with long stalls (p95 340 ms). Both libraries offer instancing for this case, which the POC does not use.
- **B3:** Three.js reaches the first frame in about 60 ms, Babylon.js in about 350 ms. With 20,000 meshes Babylon takes about 3 s, spent in `clone()`.
- **C2 (Babylon.js):** rendering from our tick needs `engine.beginFrame()` and `engine.endFrame()` around `scene.render()`. Without them, WebGPU frames are never submitted and `CreateScreenshotAsync` never resolves. This is not in the getting-started docs.
- **D5:** both capture a painted PNG on both backends, provided the capture happens right after a render.
- **D6:** both keep rendering after the canvas moves to another document, on both backends, with no error.
- **C3:** Babylon.js leaves nothing on `window`; Three.js leaves `window.__THREE__`.
- **Cold start:** the very first run of Three.js in a fresh browser took 3.4 s (WebGPU) and 27.6 s (WebGL) to the first frame. It did not happen again, including in new pages, so it is most likely the GPU shader cache warming up. Not investigated further.

## Limits

- One machine and one browser (Chrome on Apple Silicon). Firefox, Safari and mobile are not measured.
- D6 uses a same-origin iframe, not a real `window.open` pop-out window (popups need a user gesture in the test browser).
- The stress scene is not optimized (no instancing, no frozen meshes), so it measures the default per-object cost, not the best case.
