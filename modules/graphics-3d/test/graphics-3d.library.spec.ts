import { type InitContext, type ViewportState, computeViewport } from "@nanoforge-dev/common";
import type { EditorInitContext } from "@nanoforge-dev/editor-lib";
import {
  BoxGeometry,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Texture,
  Vector3,
} from "three/webgpu";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DRAW_CALL_WARNING, Graphics3DLibrary } from "../src";

const fake = vi.hoisted(() => {
  const renderers: any[] = [];
  const WebGPURenderer = vi.fn(function (this: any, params: any) {
    this.params = params;
    this.domElement = params.canvas;
    this.backend = params.forceWebGL ? { isWebGLBackend: true } : { isWebGPUBackend: true };
    this.info = { autoReset: true, render: { drawCalls: 1 }, reset: vi.fn() };
    this.init = vi.fn(async () => this);
    this.render = vi.fn();
    this.setSize = vi.fn();
    this.setPixelRatio = vi.fn();
    this.setAnimationLoop = vi.fn();
    this.dispose = vi.fn(async () => {});
    renderers.push(this);
  });
  return { renderers, WebGPURenderer };
});

vi.mock("three/webgpu", async (importOriginal) => ({
  ...(await importOriginal<typeof import("three/webgpu")>()),
  WebGPURenderer: fake.WebGPURenderer,
}));

const lastRenderer = () => fake.renderers.at(-1);

const makeCanvas = () => ({
  style: {} as Record<string, string>,
  width: 800,
  height: 600,
  remove: vi.fn(),
  toDataURL: vi.fn(() => "data:image/png;base64,AAAA"),
  getBoundingClientRect: () => ({ left: 100, top: 50, width: 800, height: 450 }),
});

const makeContainer = () => {
  const canvases: ReturnType<typeof makeCanvas>[] = [];
  return {
    offsetWidth: 800,
    offsetHeight: 600,
    canvases,
    appendChild: vi.fn(),
    ownerDocument: {
      createElement: vi.fn(() => {
        const canvas = makeCanvas();
        canvases.push(canvas);
        return canvas;
      }),
    },
  };
};

const makeViewport = (initial: ViewportState) => {
  const listeners = new Set<(state: ViewportState) => void>();
  return {
    state: initial,
    onChange: (listener: (state: ViewportState) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emit(state: ViewportState) {
      this.state = state;
      for (const listener of listeners) listener(state);
    },
    listenerCount: () => listeners.size,
  };
};

const makeInitContext = (
  container: unknown = makeContainer(),
  viewport?: ReturnType<typeof makeViewport>,
): InitContext =>
  ({
    vars: { get: () => undefined, set: () => {} },
    env: {},
    files: new Map(),
    container,
    viewport,
  }) as unknown as InitContext;

const close = (expected: Record<string, number>) =>
  Object.fromEntries(
    Object.entries(expected).map(([key, value]) => [key, expect.closeTo(value, 6)]),
  );

const run = (library: Graphics3DLibrary) => library.__run({} as never);
const events = (library: Graphics3DLibrary) => library.__events({} as never);

const makeEditor = (features: Record<string, unknown>) => {
  const listeners = new Map<string, (...args: unknown[]) => void>();
  const editor = {
    welcome: { protocolVersion: 1, features },
    emit: vi.fn(),
    on: vi.fn((event: string, listener: (...args: unknown[]) => void) => {
      listeners.set(event, listener);
    }),
    off: vi.fn(),
  };
  return { editor, send: (command: string) => listeners.get(command)?.() };
};

describe("Graphics3DLibrary", () => {
  beforeEach(() => {
    fake.renderers.length = 0;
    // Node has no ResizeObserver; the tests that need one stub their own.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
  });

  it("uses the reserved 'graphics' key", () => {
    expect(new Graphics3DLibrary().key).toBe("graphics");
  });

  it("throws before __init and without a container", async () => {
    const library = new Graphics3DLibrary();
    expect(() => library.scene).toThrow();
    expect(() => library.expose().renderer).toThrow();
    await expect(library.__init(makeInitContext(null))).rejects.toThrow(/client/);
  });

  it("does not throw when cleared before __init", async () => {
    await expect(new Graphics3DLibrary().__clear()).resolves.toBeUndefined();
  });

  it("creates the canvas in the container's own document", async () => {
    const container = makeContainer();
    await new Graphics3DLibrary().__init(makeInitContext(container));
    expect(container.ownerDocument.createElement).toHaveBeenCalledWith("canvas");
    expect(container.appendChild).toHaveBeenCalledWith(container.canvases[0]);
    expect(lastRenderer().params.canvas).toBe(container.canvases[0]);
    expect(lastRenderer().init).toHaveBeenCalled();
  });

  describe("backend", () => {
    it("lets the renderer pick WebGPU by default", async () => {
      const library = new Graphics3DLibrary();
      await library.__init(makeInitContext());
      expect(lastRenderer().params.forceWebGL).toBe(false);
      expect(library.expose().backend).toBe("webgpu");
    });

    it("forces the WebGL fallback with forceWebGL", async () => {
      const library = new Graphics3DLibrary({ forceWebGL: true });
      await library.__init(makeInitContext());
      expect(lastRenderer().params.forceWebGL).toBe(true);
      expect(library.expose().backend).toBe("webgl");
    });
  });

  describe("tick", () => {
    it("renders the scene with the active camera on every run, never with its own loop", async () => {
      const library = new Graphics3DLibrary();
      await library.__init(makeInitContext());
      await run(library);
      const camera = new PerspectiveCamera();
      library.expose().camera = camera;
      await run(library);
      expect(lastRenderer().render.mock.calls).toEqual([
        [library.scene, expect.any(PerspectiveCamera)],
        [library.scene, camera],
      ]);
      expect(lastRenderer().setAnimationLoop).not.toHaveBeenCalled();
    });

    it("calls a custom render function instead, until it is reset or the game restarts", async () => {
      const library = new Graphics3DLibrary();
      await library.__init(makeInitContext());
      const render = vi.fn();
      library.expose().render = render;
      await run(library);
      expect(render).toHaveBeenCalledOnce();
      expect(lastRenderer().render).not.toHaveBeenCalled();

      library.expose().render = undefined;
      await run(library);
      expect(lastRenderer().render).toHaveBeenCalledOnce();

      library.expose().render = render;
      await library.__clear();
      await library.__init(makeInitContext());
      await run(library);
      expect(render).toHaveBeenCalledOnce();
      expect(lastRenderer().render).toHaveBeenCalledOnce();
    });

    it("lets a custom render wrap the previous one without calling itself", async () => {
      const library = new Graphics3DLibrary();
      await library.__init(makeInitContext());
      const overlay = vi.fn();
      const base = library.expose().render;
      library.expose().render = () => {
        base();
        overlay();
      };
      await run(library);
      expect(overlay).toHaveBeenCalledOnce();
      expect(lastRenderer().render).toHaveBeenCalledOnce();
    });

    it("warns once when a frame has too many draw calls", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const library = new Graphics3DLibrary();
      await library.__init(makeInitContext());
      const renderer = lastRenderer();
      expect(renderer.info.autoReset).toBe(false);
      let callsPerFrame = 10;
      renderer.render.mockImplementation(() => (renderer.info.render.drawCalls += callsPerFrame));
      renderer.info.reset.mockImplementation(() => (renderer.info.render.drawCalls = 0));
      // Counts must not pile up across ticks: Three only resets them from its own loop.
      for (let tick = 0; tick < 300; tick++) await run(library);
      expect(warn).not.toHaveBeenCalled();

      callsPerFrame = DRAW_CALL_WARNING + 1;
      await run(library);
      await run(library);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0]?.[0]).toMatch(/InstancedMesh/);
      warn.mockRestore();
    });
  });

  describe("viewport", () => {
    const state = (fit: "contain" | "cover" | "fill", width: number, height: number) =>
      computeViewport(width, height, { width: 1920, height: 1080, fit }, 2);

    const setup = async (initial: ViewportState) => {
      const viewport = makeViewport(initial);
      const container = makeContainer();
      const library = new Graphics3DLibrary();
      await library.__init(makeInitContext(container, viewport));
      return { library, viewport, canvas: container.canvases[0]!, renderer: lastRenderer() };
    };

    it("letterboxes the canvas with contain and frames the whole design resolution", async () => {
      const { library, renderer, canvas } = await setup(state("contain", 1000, 1000));
      expect(renderer.setPixelRatio).toHaveBeenLastCalledWith(2);
      expect(renderer.setSize).toHaveBeenLastCalledWith(1000, 562.5, false);
      expect(canvas.style).toMatchObject({
        width: "1000px",
        height: "562.5px",
        left: "0px",
        top: "218.75px",
      });
      const camera = library.camera as PerspectiveCamera;
      expect(camera.aspect).toBeCloseTo(1920 / 1080);
      expect(camera.view).toMatchObject(
        close({
          fullWidth: 1000,
          fullHeight: 562.5,
          offsetX: 0,
          offsetY: 0,
          width: 1000,
          height: 562.5,
        }),
      );
    });

    it("crops the design frame with cover", async () => {
      const { library, renderer } = await setup(state("cover", 1000, 1000));
      expect(renderer.setSize).toHaveBeenLastCalledWith(1000, 1000, false);
      expect((library.camera as PerspectiveCamera).view).toMatchObject(
        close({
          fullWidth: 1920 * (1000 / 1080),
          fullHeight: 1000,
          offsetX: (1920 * (1000 / 1080) - 1000) / 2,
          offsetY: 0,
          width: 1000,
          height: 1000,
        }),
      );
    });

    it("stretches the design frame with fill", async () => {
      const { library, renderer } = await setup(state("fill", 1000, 1000));
      expect(renderer.setSize).toHaveBeenLastCalledWith(1000, 1000, false);
      const camera = library.camera as PerspectiveCamera;
      expect(camera.aspect).toBeCloseTo(1920 / 1080);
      expect(camera.view).toMatchObject(close({ fullWidth: 1000, fullHeight: 1000, offsetX: 0 }));
    });

    it("redraws right after a resize, so a paused game does not show a blank canvas", async () => {
      const { viewport, renderer } = await setup(state("contain", 1000, 1000));
      renderer.render.mockClear();
      viewport.emit(state("contain", 1920, 1080));
      expect(renderer.render).toHaveBeenCalledOnce();
    });

    it("follows viewport changes and applies them to a camera assigned later", async () => {
      const { library, viewport, renderer, canvas } = await setup(state("contain", 1000, 1000));
      viewport.emit(state("contain", 1920, 1080));
      expect(renderer.setSize).toHaveBeenLastCalledWith(1920, 1080, false);
      expect(canvas.style.top).toBe("0px");
      const camera = new PerspectiveCamera();
      library.camera = camera;
      expect(camera.aspect).toBeCloseTo(1920 / 1080);
      expect(camera.view?.fullWidth).toBe(1920);
    });
  });

  describe("without a viewport", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("follows container resizes at the window's pixel ratio, until cleared", async () => {
      let onResize: () => void = () => {};
      const disconnected = vi.fn();
      vi.stubGlobal(
        "ResizeObserver",
        class {
          constructor(callback: () => void) {
            onResize = callback;
          }
          observe() {}
          disconnect() {
            disconnected();
          }
        },
      );
      const container = makeContainer();
      Object.assign(container.ownerDocument, { defaultView: { devicePixelRatio: 2 } });
      const library = new Graphics3DLibrary();
      await library.__init(makeInitContext(container));
      const renderer = lastRenderer();
      expect(renderer.setPixelRatio).toHaveBeenLastCalledWith(2);

      Object.assign(container, { offsetWidth: 1024, offsetHeight: 768 });
      onResize();
      expect(renderer.setSize).toHaveBeenLastCalledWith(1024, 768);

      await library.__clear();
      expect(disconnected).toHaveBeenCalledOnce();
    });
  });

  describe("teardown", () => {
    it("removes the canvas and disposes the renderer when init fails", async () => {
      const original = fake.WebGPURenderer.getMockImplementation() ?? (() => {});
      fake.WebGPURenderer.mockImplementationOnce(function (this: any, params: any) {
        original.call(this, params);
        this.init = vi.fn(async () => {
          throw new Error("no GPU");
        });
      });
      const container = makeContainer();
      const library = new Graphics3DLibrary();
      await expect(library.__init(makeInitContext(container))).rejects.toThrow("no GPU");
      const [canvas] = container.canvases;
      expect(canvas?.remove).toHaveBeenCalledOnce();
      expect(lastRenderer().dispose).toHaveBeenCalledOnce();
    });

    afterEach(() => {
      delete (globalThis as { __THREE__?: unknown }).__THREE__;
    });

    it("survives 10 init/clear cycles without leaking", async () => {
      const viewport = makeViewport(computeViewport(800, 600));
      const library = new Graphics3DLibrary();
      for (let cycle = 0; cycle < 10; cycle++) {
        (globalThis as { __THREE__?: unknown }).__THREE__ = "187";
        const container = makeContainer();
        await library.__init(makeInitContext(container, viewport));
        const geometry = new BoxGeometry();
        const texture = new Texture();
        const material = new MeshStandardMaterial({ map: texture });
        const disposed = [
          vi.spyOn(geometry, "dispose"),
          vi.spyOn(material, "dispose"),
          vi.spyOn(texture, "dispose"),
        ];
        library.scene.add(new Mesh(geometry, material));
        await run(library);
        await library.__clear();

        for (const spy of disposed) expect(spy).toHaveBeenCalledOnce();
        expect(fake.renderers[cycle].dispose).toHaveBeenCalledOnce();
        expect(container.canvases[0]!.remove).toHaveBeenCalledOnce();
        expect(viewport.listenerCount()).toBe(0);
        expect("__THREE__" in globalThis).toBe(false);
        expect(() => library.scene).toThrow();
      }
      expect(fake.renderers).toHaveLength(10);
    });
  });

  describe("screen helpers", () => {
    it("projects a world point to the page and picks the object under it", async () => {
      const library = new Graphics3DLibrary();
      await library.__init(
        makeInitContext(makeContainer(), makeViewport(computeViewport(800, 450))),
      );
      const box = new Mesh(new BoxGeometry(), new MeshStandardMaterial());
      library.scene.add(box);
      box.updateMatrixWorld();
      library.camera.updateMatrixWorld();

      const center = library.worldToScreen(new Vector3(0, 0, 0));
      expect(center.x).toBeCloseTo(500);
      expect(center.y).toBeCloseTo(275);
      expect(library.raycast(center.x, center.y)[0]?.object).toBe(box);
      expect(library.raycast(101, 51)).toHaveLength(0);
    });
  });

  describe("editor", () => {
    const setup = async (features: Record<string, unknown>) => {
      const library = new Graphics3DLibrary();
      await library.__init(makeInitContext());
      const { editor, send } = makeEditor(features);
      await library.__editorInit({ editor } as unknown as EditorInitContext);
      return { library, editor, send };
    };

    it("emits nothing about the camera unless the editor asked for it", async () => {
      const { library, editor } = await setup({});
      await events(library);
      expect(editor.emit).not.toHaveBeenCalled();
    });

    it("emits the camera matrices once, then only when they change", async () => {
      const { library, editor } = await setup({ graphicsCamera: true });
      await events(library);
      await events(library);
      expect(editor.emit).toHaveBeenCalledTimes(1);
      const [event, payload] = editor.emit.mock.calls[0]!;
      expect(event).toBe("graphics-camera");
      expect(payload.view).toHaveLength(16);
      expect(payload.view[14]).toBeCloseTo(-5);
      expect(payload.projection).toEqual(library.camera.projectionMatrix.toArray());

      library.camera.position.x = 2;
      await events(library);
      expect(editor.emit).toHaveBeenCalledTimes(2);
    });

    it("keeps emitting the camera after a restart (__editorInit runs once per app)", async () => {
      const { library, editor } = await setup({ graphicsCamera: true });
      await library.__clear();
      await library.__init(makeInitContext());
      await events(library);
      expect(editor.emit).toHaveBeenCalledWith("graphics-camera", expect.anything());
    });

    it("captures through the custom render function", async () => {
      const { library, editor, send } = await setup({});
      const render = vi.fn();
      library.render = render;
      send("graphics-capture");
      expect(render).toHaveBeenCalledOnce();
      expect(editor.emit).toHaveBeenCalledWith("graphics-capture", expect.any(String));
    });

    it("answers graphics-capture with an empty string between a clear and an init", async () => {
      const { library, editor, send } = await setup({});
      await library.__clear();
      send("graphics-capture");
      expect(editor.emit).toHaveBeenCalledWith("graphics-capture", "");
    });

    it("sends the camera's world position, parents included", async () => {
      const { library, editor } = await setup({ graphicsCamera: true });
      const parent = new Object3D();
      const camera = new PerspectiveCamera();
      parent.add(camera);
      parent.position.x = 3;
      library.expose().camera = camera;
      await events(library);
      const view = (editor.emit.mock.calls.at(-1)?.[1] as { view: number[] }).view;
      expect(view[12]).toBeCloseTo(-3);
    });

    it("renders a frame and returns it as a PNG on graphics-capture", async () => {
      const { library, editor, send } = await setup({});
      send("graphics-capture");
      expect(lastRenderer().render).toHaveBeenCalledWith(library.scene, library.camera);
      expect(editor.emit).toHaveBeenCalledWith("graphics-capture", "data:image/png;base64,AAAA");
    });
  });
});
