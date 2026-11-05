import {
  type Context,
  type InitContext,
  Library,
  type ViewportState,
  defineLibraryKey,
} from "@nanoforge-dev/common";
import type {
  EditorAwareLibrary,
  EditorContextApi,
  EditorInitContext,
} from "@nanoforge-dev/editor-lib";
import {
  type Camera,
  type Intersection,
  type Matrix4,
  type Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Texture,
  Vector2,
  type Vector3,
  WebGPURenderer,
} from "three/webgpu";

import "./editor-augmentation";
import type { Graphics3DBackend, Graphics3DContextApi, ScreenPoint } from "./graphics-context.type";

/** Options of {@link Graphics3DLibrary}. */
export interface Graphics3DOptions {
  /**
   * Uses the WebGL2 backend even where WebGPU is available.
   *
   * @default false
   */
  forceWebGL?: boolean;
}

/** Draw calls in one frame above which a one-time performance warning is logged. */
export const DRAW_CALL_WARNING = 2000;

/**
 * Built-in 3D graphics library powered by [Three.js](https://threejs.org/).
 *
 * @remarks
 * Creates a `WebGPURenderer` (WebGL2 fallback) on a canvas added to the
 * container, a `Scene` and a default `PerspectiveCamera`. It renders once per
 * tick, after the ECS systems, and never on its own: a paused game keeps its
 * last image. The canvas follows every viewport change like graphics-2d's
 * stage: the design resolution is the camera's full frame, letterboxed or
 * cropped according to the viewport's fit. Client-only — `__init` throws if
 * `InitContext.container` is missing.
 */
export class Graphics3DLibrary extends Library implements EditorAwareLibrary {
  readonly key = defineLibraryKey("graphics");

  private _renderer?: WebGPURenderer;
  private _scene?: Scene;
  private _camera?: Camera;
  private _viewport?: ViewportState;
  private _unsubscribeViewport?: () => void;
  private _warnedDrawCalls = false;
  private _editor?: EditorContextApi;
  private _sentView?: Matrix4;
  private _sentProjection?: Matrix4;
  private _customRender?: () => void;

  constructor(private readonly _options: Graphics3DOptions = {}) {
    super();
  }

  public override async __init(ctx: InitContext): Promise<void> {
    if (!ctx.container) {
      throw new Error(
        "Graphics3DLibrary must be registered on the client (InitContext must contain a container element).",
      );
    }
    // From the container's document, not the global one: the game may live in a pop-out window.
    const canvas = ctx.container.ownerDocument.createElement("canvas");
    canvas.style.position = "relative";
    canvas.style.display = "block";
    ctx.container.appendChild(canvas);

    this._renderer = new WebGPURenderer({
      canvas,
      antialias: true,
      forceWebGL: this._options.forceWebGL ?? false,
    });
    await this._renderer.init();
    // Three resets `info` from its own animation loop, which is not our tick: we reset it per frame.
    this._renderer.info.autoReset = false;
    this._scene = new Scene();
    const camera = new PerspectiveCamera(50, 16 / 9, 0.1, 1000);
    camera.position.set(0, 0, 5);
    this._camera = camera;
    this._warnedDrawCalls = false;

    if (ctx.viewport) {
      this._applyViewport(ctx.viewport.state);
      this._unsubscribeViewport = ctx.viewport.onChange((state) => this._applyViewport(state));
    } else {
      this._renderer.setSize(ctx.container.offsetWidth, ctx.container.offsetHeight);
      this._applyCamera();
    }
  }

  /** Listens to the editor's `graphics-capture` command and keeps the editor for `graphics-camera`. */
  public async __editorInit(ctx: EditorInitContext): Promise<void> {
    this._editor = ctx.editor;
    ctx.editor.on("graphics-capture", () => {
      if (!this._renderer) return;
      // A WebGL/WebGPU canvas is only readable right after a render.
      this._draw();
      ctx.editor.emit("graphics-capture", this._renderer.domElement.toDataURL("image/png"));
    });
  }

  /** Emits `graphics-camera` while the editor asks for it, paused ticks included. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public override async __events(_ctx: Context): Promise<void> {
    if (!this._editor?.welcome?.features.graphicsCamera) {
      this._sentView = this._sentProjection = undefined;
      return;
    }
    const camera = this._camera;
    if (!camera) return;
    camera.updateMatrixWorld();
    const view = camera.matrixWorld.clone().invert();
    if (this._sentView?.equals(view) && this._sentProjection?.equals(camera.projectionMatrix))
      return;
    this._sentView = view;
    this._sentProjection = camera.projectionMatrix.clone();
    this._editor.emit("graphics-camera", {
      view: view.toArray(),
      projection: camera.projectionMatrix.toArray(),
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public override async __run(_ctx: Context): Promise<void> {
    this.renderer.info.reset();
    this._draw();
    const drawCalls = this.renderer.info.render.drawCalls;
    if (drawCalls > DRAW_CALL_WARNING && !this._warnedDrawCalls) {
      this._warnedDrawCalls = true;
      console.warn(
        `[graphics-3d] ${drawCalls} draw calls in one frame: the frame rate may drop. Draw many identical objects with one InstancedMesh (see the graphics-3d "Performance" docs page).`,
      );
    }
  }

  public override async __clear(): Promise<void> {
    this._unsubscribeViewport?.();
    this._unsubscribeViewport = undefined;
    if (this._scene) disposeScene(this._scene);
    if (this._renderer) {
      await this._renderer.dispose();
      this._renderer.domElement.remove();
    }
    this._renderer = this._scene = this._camera = this._viewport = undefined;
    // `__editorInit` runs once per app, so the editor is kept across restarts.
    this._sentView = this._sentProjection = this._customRender = undefined;
    delete (globalThis as { __THREE__?: unknown }).__THREE__;
  }

  public get renderer(): WebGPURenderer {
    if (!this._renderer) this.throwNotInitializedError();
    return this._renderer;
  }

  public get scene(): Scene {
    if (!this._scene) this.throwNotInitializedError();
    return this._scene;
  }

  public get camera(): Camera {
    if (!this._camera) this.throwNotInitializedError();
    return this._camera;
  }

  public set camera(camera: Camera) {
    if (!this._renderer) this.throwNotInitializedError();
    this._camera = camera;
    this._applyCamera();
  }

  public get render(): () => void {
    return () => this._draw();
  }

  public set render(render: (() => void) | undefined) {
    this._customRender = render;
  }

  public get backend(): Graphics3DBackend {
    return (this.renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend
      ? "webgpu"
      : "webgl";
  }

  public raycast(
    clientX: number,
    clientY: number,
    objects: Object3D[] = this.scene.children,
  ): Intersection[] {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    const raycaster = new Raycaster();
    raycaster.setFromCamera(ndc, this.camera);
    return raycaster.intersectObjects(objects, true);
  }

  public worldToScreen(point: Vector3): ScreenPoint {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = point.clone().project(this.camera);
    return {
      x: rect.left + ((ndc.x + 1) / 2) * rect.width,
      y: rect.top + ((1 - ndc.y) / 2) * rect.height,
    };
  }

  public override expose(): Graphics3DContextApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const library = this;
    return {
      get renderer() {
        return library.renderer;
      },
      get scene() {
        return library.scene;
      },
      get camera() {
        return library.camera;
      },
      set camera(camera) {
        library.camera = camera;
      },
      get backend() {
        return library.backend;
      },
      get render() {
        return library.render;
      },
      set render(render) {
        library.render = render;
      },
      raycast: (clientX, clientY, objects) => library.raycast(clientX, clientY, objects),
      worldToScreen: (point) => library.worldToScreen(point),
    };
  }

  /** Draws one frame with the custom render function, or the scene through the camera. */
  private _draw(): void {
    if (this._customRender) this._customRender();
    else this.renderer.render(this.scene, this.camera);
  }

  /** Sizes the canvas to the visible game area and letterboxes it inside the container. */
  private _applyViewport(state: ViewportState): void {
    const renderer = this._renderer;
    if (!renderer) return;
    this._viewport = state;
    renderer.setPixelRatio(state.pixelRatio);
    renderer.setSize(state.visibleWidth, state.visibleHeight, false);
    const style = renderer.domElement.style;
    style.width = `${state.visibleWidth}px`;
    style.height = `${state.visibleHeight}px`;
    style.left = `${state.contentLeft}px`;
    style.top = `${state.contentTop}px`;
    this._applyCamera();
  }

  /**
   * Makes the camera's full frame the design resolution and shows only its
   * visible part, so `cover` crops and `fill` stretches as in 2D.
   */
  private _applyCamera(): void {
    const camera = this._camera;
    if (!(camera instanceof PerspectiveCamera || camera instanceof OrthographicCamera)) return;
    const state = this._viewport;
    if (state) {
      camera.setViewOffset(
        state.designWidth * state.scaleX,
        state.designHeight * state.scaleY,
        Math.abs(state.originX),
        Math.abs(state.originY),
        state.visibleWidth,
        state.visibleHeight,
      );
      // After setViewOffset, which sets the aspect to the full frame's: `fill` stretches the design frame.
      if (camera instanceof PerspectiveCamera)
        camera.aspect = state.designWidth / state.designHeight;
    } else if (camera instanceof PerspectiveCamera) {
      const canvas = this.renderer.domElement;
      camera.aspect = canvas.width / canvas.height || 1;
    }
    camera.updateProjectionMatrix();
  }
}

/** Frees the GPU resources of everything in the scene: geometries, materials and their textures. */
const disposeScene = (scene: Scene): void => {
  scene.traverse((object) => {
    const { geometry, material } = object as Object3D & {
      geometry?: { dispose(): void };
      material?: object | object[];
    };
    geometry?.dispose();
    for (const item of Array.isArray(material) ? material : material ? [material] : []) {
      for (const value of Object.values(item)) if (value instanceof Texture) value.dispose();
      (item as { dispose?(): void }).dispose?.();
    }
    (object as { dispose?(): void }).dispose?.();
  });
  for (const value of [scene.background, scene.environment])
    if (value instanceof Texture) value.dispose();
};
