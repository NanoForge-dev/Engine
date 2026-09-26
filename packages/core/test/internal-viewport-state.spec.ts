import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { InternalViewportState } from "../src/internal/internal-viewport-state";

type Handler = () => void;

const makeEventTarget = () => {
  const listeners = new Map<string, Set<Handler>>();
  return {
    addEventListener: vi.fn((type: string, handler: Handler) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(handler);
    }),
    removeEventListener: vi.fn((type: string, handler: Handler) => {
      listeners.get(type)?.delete(handler);
    }),
    dispatch: (type: string) => {
      for (const handler of [...(listeners.get(type) ?? [])]) handler();
    },
    count: (type: string) => listeners.get(type)?.size ?? 0,
  };
};

const makeContainer = (width: number, height: number, left = 0, top = 0) => ({
  style: {} as Record<string, string>,
  clientWidth: width,
  clientHeight: height,
  getBoundingClientRect: () => ({ left, top }),
});

const asDiv = (container: ReturnType<typeof makeContainer>) =>
  container as unknown as HTMLDivElement;

describe("InternalViewportState", () => {
  describe("without browser APIs", () => {
    it("should compute the initial state, hide container overflow and paint it black", () => {
      const container = makeContainer(2560, 1440);
      const viewport = new InternalViewportState(asDiv(container), { width: 1920, height: 1080 });

      expect(container.style.overflow).toBe("hidden");
      expect(container.style.background).toBe("black");
      expect(viewport.state.scaleX).toBeCloseTo(4 / 3);
      expect(viewport.state.fit).toBe("contain");
      viewport.dispose();
    });

    it("should refresh synchronously when requestAnimationFrame is unavailable", () => {
      const container = makeContainer(800, 600);
      const viewport = new InternalViewportState(asDiv(container));
      const listener = vi.fn();
      viewport.onChange(listener);

      container.clientWidth = 1000;
      viewport.scheduleUpdate();

      expect(listener).toHaveBeenCalledOnce();
      expect(viewport.state.containerWidth).toBe(1000);
    });
  });

  describe("coordinate mapping", () => {
    it("should map the issue's example (100,100) at 1920x1080 to (133,133) at 2560x1440", () => {
      const viewport = new InternalViewportState(asDiv(makeContainer(2560, 1440)), {
        width: 1920,
        height: 1080,
      });
      const screen = viewport.gameToScreen(100, 100);
      expect(screen.x).toBeCloseTo(133.33, 2);
      expect(screen.y).toBeCloseTo(133.33, 2);
    });

    it.each(["fill", "contain", "cover"] as const)(
      "should round-trip screen <-> game in %s mode with a container offset",
      (fit) => {
        const viewport = new InternalViewportState(asDiv(makeContainer(1000, 1000, 50, 30)), {
          width: 1920,
          height: 1080,
          fit,
        });
        const screen = viewport.gameToScreen(960, 540);
        const game = viewport.screenToGame(screen.x, screen.y);
        expect(game.x).toBeCloseTo(960);
        expect(game.y).toBeCloseTo(540);
        // The design center always lands on the container center.
        expect(screen.x).toBeCloseTo(50 + 500);
        expect(screen.y).toBeCloseTo(30 + 500);
      },
    );

    it("should account for the contain letterbox", () => {
      const viewport = new InternalViewportState(asDiv(makeContainer(1000, 1000)), {
        width: 1920,
        height: 1080,
        fit: "contain",
      });
      // The top of the game sits below the letterbox bar.
      expect(viewport.screenToGame(0, viewport.state.contentTop).y).toBeCloseTo(0);
    });
  });

  describe("dynamic window size changes", () => {
    let windowMock: ReturnType<typeof makeEventTarget> & {
      devicePixelRatio: number;
      visualViewport: ReturnType<typeof makeEventTarget>;
      matchMedia: ReturnType<typeof vi.fn>;
    };
    let documentMock: ReturnType<typeof makeEventTarget>;
    let mediaQueries: (ReturnType<typeof makeEventTarget> & { media: string })[];
    let frames: FrameRequestCallback[];
    let observerCallback: (() => void) | undefined;
    const observe = vi.fn();
    const disconnect = vi.fn();

    const flushFrames = () => {
      const pending = frames;
      frames = [];
      for (const frame of pending) frame(0);
    };

    beforeEach(() => {
      mediaQueries = [];
      frames = [];
      observerCallback = undefined;
      observe.mockClear();
      disconnect.mockClear();

      windowMock = {
        ...makeEventTarget(),
        devicePixelRatio: 1,
        visualViewport: makeEventTarget(),
        matchMedia: vi.fn((media: string) => {
          const query = { ...makeEventTarget(), media };
          mediaQueries.push(query);
          return query;
        }),
      };
      documentMock = makeEventTarget();

      vi.stubGlobal("window", windowMock);
      vi.stubGlobal("document", documentMock);
      vi.stubGlobal(
        "requestAnimationFrame",
        vi.fn((callback: FrameRequestCallback) => frames.push(callback)),
      );
      vi.stubGlobal("cancelAnimationFrame", vi.fn());
      vi.stubGlobal(
        "ResizeObserver",
        vi.fn(function (this: any, callback: () => void) {
          observerCallback = callback;
          this.observe = observe;
          this.disconnect = disconnect;
        }),
      );
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("should subscribe to every size-change source", () => {
      const container = makeContainer(800, 600);
      new InternalViewportState(asDiv(container));

      expect(windowMock.count("resize")).toBe(1);
      expect(windowMock.visualViewport.count("resize")).toBe(1);
      expect(documentMock.count("fullscreenchange")).toBe(1);
      expect(observe).toHaveBeenCalledWith(container);
      expect(windowMock.matchMedia).toHaveBeenCalledWith("(resolution: 1dppx)");
    });

    it.each([
      ["window resize", () => windowMock.dispatch("resize")],
      ["fullscreenchange", () => documentMock.dispatch("fullscreenchange")],
      ["visualViewport resize", () => windowMock.visualViewport.dispatch("resize")],
      ["container ResizeObserver", () => observerCallback!()],
    ])("should recompute and notify on %s", (_, trigger) => {
      const container = makeContainer(1920, 1080);
      const viewport = new InternalViewportState(asDiv(container), { width: 1920, height: 1080 });
      const listener = vi.fn();
      viewport.onChange(listener);

      container.clientWidth = 2560;
      container.clientHeight = 1440;
      trigger();
      expect(listener).not.toHaveBeenCalled();
      flushFrames();

      expect(listener).toHaveBeenCalledOnce();
      expect(viewport.state.scaleX).toBeCloseTo(4 / 3);
    });

    it("should coalesce a burst of events into one recompute per frame", () => {
      const container = makeContainer(800, 600);
      const viewport = new InternalViewportState(asDiv(container));
      const listener = vi.fn();
      viewport.onChange(listener);

      container.clientWidth = 1024;
      windowMock.dispatch("resize");
      windowMock.dispatch("resize");
      observerCallback!();
      documentMock.dispatch("fullscreenchange");

      expect(frames).toHaveLength(1);
      flushFrames();
      expect(listener).toHaveBeenCalledOnce();
    });

    it("should not notify when the size did not change", () => {
      const viewport = new InternalViewportState(asDiv(makeContainer(800, 600)));
      const listener = vi.fn();
      viewport.onChange(listener);

      windowMock.dispatch("resize");
      flushFrames();

      expect(listener).not.toHaveBeenCalled();
    });

    it("should notify on a devicePixelRatio change and re-arm the media query", () => {
      const viewport = new InternalViewportState(asDiv(makeContainer(800, 600)));
      const listener = vi.fn();
      viewport.onChange(listener);

      windowMock.devicePixelRatio = 2;
      mediaQueries[0]!.dispatch("change");
      flushFrames();

      expect(listener).toHaveBeenCalledOnce();
      expect(viewport.state.pixelRatio).toBe(2);
      expect(mediaQueries[0]!.count("change")).toBe(0);
      expect(mediaQueries[1]!.media).toBe("(resolution: 2dppx)");
      expect(mediaQueries[1]!.count("change")).toBe(1);
    });

    it("should recompute on setOptions", () => {
      const viewport = new InternalViewportState(asDiv(makeContainer(1000, 1000)), {
        width: 1920,
        height: 1080,
      });
      const listener = vi.fn();
      viewport.asViewportContext().onChange(listener);

      viewport.asViewportContext().setOptions({ fit: "cover" });

      expect(listener).toHaveBeenCalledOnce();
      expect(viewport.state.fit).toBe("cover");
      expect(viewport.state.scaleX).toBeCloseTo(1000 / 1080);
    });

    it("should apply a custom background, initially and through setOptions", () => {
      const container = makeContainer(800, 600);
      const viewport = new InternalViewportState(asDiv(container), { background: "#123456" });
      expect(container.style.background).toBe("#123456");

      viewport.setOptions({ background: "white" });
      expect(container.style.background).toBe("white");

      viewport.setOptions({ fit: "cover" });
      expect(container.style.background).toBe("white");
    });

    it("should stop notifying after unsubscribe", () => {
      const container = makeContainer(800, 600);
      const viewport = new InternalViewportState(asDiv(container));
      const listener = vi.fn();
      const unsubscribe = viewport.onChange(listener);

      unsubscribe();
      container.clientWidth = 1000;
      viewport.refresh();

      expect(listener).not.toHaveBeenCalled();
    });

    it("should remove every listener on dispose", () => {
      const viewport = new InternalViewportState(asDiv(makeContainer(800, 600)));
      windowMock.dispatch("resize");

      viewport.dispose();

      expect(windowMock.count("resize")).toBe(0);
      expect(windowMock.visualViewport.count("resize")).toBe(0);
      expect(documentMock.count("fullscreenchange")).toBe(0);
      expect(mediaQueries[0]!.count("change")).toBe(0);
      expect(disconnect).toHaveBeenCalledOnce();
      expect(cancelAnimationFrame).toHaveBeenCalledOnce();
    });
  });
});
