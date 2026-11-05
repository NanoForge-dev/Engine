import type { Camera, Intersection, Object3D, Scene, Vector3, WebGPURenderer } from "three/webgpu";

/** Backend the renderer runs on: WebGPU, or its WebGL2 fallback. */
export type Graphics3DBackend = "webgpu" | "webgl";

/** A point in the page, in CSS px (same frame as `PointerEvent.clientX`/`clientY`). */
export interface ScreenPoint {
  x: number;
  y: number;
}

/** Public surface of `Graphics3DLibrary`, exposed on `Context.graphics`. */
export interface Graphics3DContextApi {
  /** The Three.js renderer. Rendered by the library every tick; never call `setAnimationLoop`. */
  readonly renderer: WebGPURenderer;
  /** The scene rendered every tick — add objects here to show them. */
  readonly scene: Scene;
  /**
   * The camera the scene is rendered with. A default `PerspectiveCamera` at
   * `(0, 0, 5)` looking at the origin; assign another camera to switch.
   */
  camera: Camera;
  /** Which backend runs. */
  readonly backend: Graphics3DBackend;
  /**
   * Objects under a point of the page, nearest first.
   *
   * @param clientX - Page x, in CSS px (`PointerEvent.clientX`).
   * @param clientY - Page y, in CSS px (`PointerEvent.clientY`).
   * @param objects - Objects to test, with their children. Defaults to the whole scene.
   */
  raycast(clientX: number, clientY: number, objects?: Object3D[]): Intersection[];
  /** Where a world point is drawn in the page, in CSS px. */
  worldToScreen(point: Vector3): ScreenPoint;
}
