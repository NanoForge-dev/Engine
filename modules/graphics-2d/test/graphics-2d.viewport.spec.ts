import { type InitContext, type ViewportState, computeViewport } from "@nanoforge-dev/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Graphics2DLibrary } from "../src";

const konva = vi.hoisted(() => {
  const setPixelRatio = vi.fn();
  const Konva = {
    pixelRatio: 1,
    Stage: vi.fn(function (this: any) {
      this.content = { style: {} as Record<string, string> };
      this.add = vi.fn();
      this.size = vi.fn();
      this.scale = vi.fn();
      this.position = vi.fn();
      this.batchDraw = vi.fn();
      this.destroy = vi.fn();
      this.getLayers = vi.fn(() => [{ getCanvas: () => ({ setPixelRatio }) }]);
    }),
    Layer: vi.fn(function () {}),
  };
  return { Konva, setPixelRatio };
});

vi.mock("konva", () => ({ default: konva.Konva }));

const makeViewport = (initial: ViewportState) => {
  const listeners = new Set<(state: ViewportState) => void>();
  return {
    state: initial,
    onChange: vi.fn((listener: (state: ViewportState) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }),
    emit(state: ViewportState) {
      this.state = state;
      for (const listener of listeners) listener(state);
    },
    listenerCount: () => listeners.size,
  };
};

const makeInitContext = (viewport?: ReturnType<typeof makeViewport>): InitContext =>
  ({
    vars: { get: () => undefined, set: () => {} },
    env: {},
    files: new Map(),
    container: { offsetWidth: 1000, offsetHeight: 1000 },
    viewport,
  }) as unknown as InitContext;

describe("Graphics2DLibrary viewport", () => {
  beforeEach(() => {
    konva.Konva.pixelRatio = 1;
    konva.setPixelRatio.mockClear();
    vi.stubGlobal("window", {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should size, scale, offset and letterbox the stage from the viewport", async () => {
    const library = new Graphics2DLibrary();
    const state = computeViewport(1000, 1000, { width: 1920, height: 1080, fit: "contain" });
    await library.__init(makeInitContext(makeViewport(state)));

    const stage = library.stage as any;
    expect(stage.size).toHaveBeenCalledWith({
      width: state.visibleWidth,
      height: state.visibleHeight,
    });
    expect(stage.scale).toHaveBeenCalledWith({ x: state.scaleX, y: state.scaleY });
    expect(stage.position).toHaveBeenCalledWith({ x: state.originX, y: state.originY });
    expect(stage.content.style.left).toBe("0px");
    expect(stage.content.style.top).toBe(`${state.contentTop}px`);
    expect(stage.batchDraw).toHaveBeenCalled();
  });

  it("should follow viewport changes (window resize, fit change)", async () => {
    const library = new Graphics2DLibrary();
    const viewport = makeViewport(computeViewport(1920, 1080, { width: 1920, height: 1080 }));
    await library.__init(makeInitContext(viewport));
    const stage = library.stage as any;

    const next = computeViewport(1000, 1000, { width: 1920, height: 1080, fit: "cover" });
    viewport.emit(next);

    expect(stage.scale).toHaveBeenLastCalledWith({ x: next.scaleX, y: next.scaleY });
    expect(stage.position).toHaveBeenLastCalledWith({ x: next.originX, y: next.originY });
  });

  it("should update the canvas pixel ratio when the device pixel ratio changes", async () => {
    const library = new Graphics2DLibrary();
    const viewport = makeViewport(computeViewport(800, 600, {}, 1));
    await library.__init(makeInitContext(viewport));
    expect(konva.setPixelRatio).not.toHaveBeenCalled();

    viewport.emit(computeViewport(800, 600, {}, 2));

    expect(konva.Konva.pixelRatio).toBe(2);
    expect(konva.setPixelRatio).toHaveBeenCalledWith(2);
  });

  it("should unsubscribe from the viewport on __clear", async () => {
    const library = new Graphics2DLibrary();
    const viewport = makeViewport(computeViewport(800, 600));
    await library.__init(makeInitContext(viewport));
    expect(viewport.listenerCount()).toBe(1);

    await library.__clear();

    expect(viewport.listenerCount()).toBe(0);
  });

  it("should keep the container size when no viewport is provided", async () => {
    const library = new Graphics2DLibrary();
    await library.__init(makeInitContext());

    expect(konva.Konva.Stage).toHaveBeenLastCalledWith(
      expect.objectContaining({ width: 1000, height: 1000 }),
    );
    expect((library.stage as any).scale).not.toHaveBeenCalled();
  });
});
