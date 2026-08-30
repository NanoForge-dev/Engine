import type { InitContext } from "@nanoforge-dev/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { InputEnum, InputLibrary } from "../src";

type MockInputEvent = {
  code?: string;
  button?: number;
  buttons?: number;
  clientX?: number;
  clientY?: number;
  deltaX?: number;
  deltaY?: number;
  deltaZ?: number;
};

const makeEventTargetMock = () => {
  const listeners: Record<string, ((e: MockInputEvent) => void)[]> = {};
  return {
    addEventListener: vi.fn((event: string, handler: (e: MockInputEvent) => void) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    }),
    removeEventListener: vi.fn((event: string, handler: (e: MockInputEvent) => void) => {
      listeners[event] = (listeners[event] ?? []).filter((h) => h !== handler);
    }),
    dispatch: (event: string, e: Partial<MockInputEvent>) => {
      listeners[event]?.forEach((h) => h(e as MockInputEvent));
    },
  };
};

const makeInitContext = (container: unknown): InitContext =>
  ({
    vars: { get: () => undefined, set: () => {} },
    env: {},
    files: new Map(),
    container,
  }) as InitContext;

describe("InputLibrary", () => {
  let windowMock: ReturnType<typeof makeEventTargetMock> & {
    getBoundingClientRect: () => { x: number; y: number };
  };
  let documentMock: ReturnType<typeof makeEventTargetMock> & { hidden: boolean };

  beforeEach(() => {
    windowMock = { ...makeEventTargetMock(), getBoundingClientRect: () => ({ x: 0, y: 0 }) };
    documentMock = { ...makeEventTargetMock(), hidden: false };

    vi.stubGlobal("window", windowMock);
    vi.stubGlobal("document", documentMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("metadata", () => {
    it("should expose the reserved 'input' key", () => {
      expect(new InputLibrary().key).toBe("input");
    });
  });

  describe("before initialization", () => {
    it("should throw when methods are called before __init", () => {
      const library = new InputLibrary();
      expect(() => library.isKeyPressed(InputEnum.KeyA)).toThrow();
      expect(() => library.getPressedKeys()).toThrow();
      expect(() => library.getMousePosition()).toThrow();
      expect(() => library.getMouseState()).toThrow();
      expect(() => library.isDragging()).toThrow();
      expect(() => library.getDragState()).toThrow();
      expect(() => library.getWheelState()).toThrow();
    });

    it("should throw when __init is called without a container", async () => {
      const library = new InputLibrary();
      await expect(library.__init(makeInitContext(undefined))).rejects.toThrow();
    });

    it("should throw when __run is called before __init", async () => {
      const library = new InputLibrary();
      await expect(library.__run({} as any)).rejects.toThrow();
    });
  });

  describe("after initialization", () => {
    let library: InputLibrary;

    beforeEach(async () => {
      library = new InputLibrary();
      await library.__init(makeInitContext(windowMock));
    });

    it("should register all expected event listeners", () => {
      for (const event of [
        "keydown",
        "keyup",
        "mousedown",
        "mouseup",
        "mousemove",
        "wheel",
        "mouseenter",
        "mouseleave",
        "blur",
        "visibilitychange",
      ]) {
        expect(windowMock.addEventListener).toHaveBeenCalledWith(event, expect.any(Function));
      }
    });

    it("should return false for any key before any key event", () => {
      expect(library.isKeyPressed(InputEnum.KeyA)).toBe(false);
    });

    it("should return true for a key after keydown, then false after keyup", () => {
      windowMock.dispatch("keydown", { code: InputEnum.KeyA });
      expect(library.isKeyPressed(InputEnum.KeyA)).toBe(true);

      windowMock.dispatch("keyup", { code: InputEnum.KeyA });
      expect(library.isKeyPressed(InputEnum.KeyA)).toBe(false);
    });

    it("should list currently pressed keys", () => {
      windowMock.dispatch("keydown", { code: InputEnum.KeyA });
      windowMock.dispatch("keydown", { code: InputEnum.Space });
      const pressed = library.getPressedKeys();
      expect(pressed).toContain(InputEnum.KeyA);
      expect(pressed).toContain(InputEnum.Space);
      expect(pressed).toHaveLength(2);
    });

    it("should handle mouse button press and release", () => {
      windowMock.dispatch("mousedown", { button: 0, clientX: 10, clientY: 20 });
      expect(library.isKeyPressed(InputEnum.MouseLeft)).toBe(true);

      windowMock.dispatch("mouseup", { button: 0, clientX: 10, clientY: 20 });
      expect(library.isKeyPressed(InputEnum.MouseLeft)).toBe(false);
    });

    it("should update mouse position and delta on move", () => {
      windowMock.dispatch("mousemove", { clientX: 100, clientY: 200, buttons: 0 });

      expect(library.getMousePosition()).toStrictEqual({ x: 100, y: 200 });
      expect(library.getMouseState()).toMatchObject({ x: 100, y: 200, deltaX: 100, deltaY: 200 });
    });

    it("should start, update and stop dragging", () => {
      windowMock.dispatch("mousedown", { button: 0, clientX: 10, clientY: 20 });
      expect(library.isDragging(InputEnum.MouseLeft)).toBe(true);

      windowMock.dispatch("mousemove", { clientX: 25, clientY: 45, buttons: 1 });
      expect(library.getDragState()).toMatchObject({ x: 25, y: 45, deltaX: 15, deltaY: 25 });

      windowMock.dispatch("mouseup", { button: 0, clientX: 25, clientY: 45 });
      expect(library.isDragging()).toBe(false);
    });

    it("should accumulate wheel delta and reset it on __run", async () => {
      windowMock.dispatch("wheel", { deltaX: 1, deltaY: 2, deltaZ: 3 });
      windowMock.dispatch("wheel", { deltaX: 4, deltaY: 5, deltaZ: 6 });
      expect(library.getWheelState()).toStrictEqual({ deltaX: 5, deltaY: 7, deltaZ: 9 });

      await library.__run({} as any);

      expect(library.getWheelState()).toStrictEqual({ deltaX: 0, deltaY: 0, deltaZ: 0 });
    });

    it("should reset inputs on blur", () => {
      windowMock.dispatch("keydown", { code: InputEnum.KeyA });
      windowMock.dispatch("blur", {});
      expect(library.isKeyPressed(InputEnum.KeyA)).toBe(false);
    });

    it("should reset inputs when document becomes hidden", () => {
      windowMock.dispatch("keydown", { code: InputEnum.KeyA });
      documentMock.hidden = true;
      windowMock.dispatch("visibilitychange", {});
      expect(library.isKeyPressed(InputEnum.KeyA)).toBe(false);
    });

    it("should update pointer focus on mouse enter and leave", () => {
      windowMock.dispatch("mouseenter", {});
      expect(library.getMouseState().focus).toBe(true);

      windowMock.dispatch("mouseleave", {});
      expect(library.getMouseState().focus).toBe(false);
    });
  });

  describe("__clear", () => {
    it("removes every registered listener", async () => {
      const library = new InputLibrary();
      await library.__init(makeInitContext(windowMock));

      await library.__clear({} as any);

      expect(windowMock.removeEventListener).toHaveBeenCalledWith("keydown", expect.any(Function));
      expect(windowMock.removeEventListener).toHaveBeenCalledWith("keyup", expect.any(Function));
      expect(windowMock.removeEventListener).toHaveBeenCalledWith(
        "mousedown",
        expect.any(Function),
      );
      expect(windowMock.removeEventListener.mock.calls.length).toBeGreaterThanOrEqual(10);
    });

    it("does not throw when called before __init", async () => {
      await expect(new InputLibrary().__clear({} as any)).resolves.toBeUndefined();
    });
  });

  describe("expose", () => {
    it("returns bound methods that behave like the instance methods", async () => {
      const library = new InputLibrary();
      await library.__init(makeInitContext(windowMock));
      windowMock.dispatch("keydown", { code: InputEnum.KeyA });

      expect(library.expose().isKeyPressed(InputEnum.KeyA)).toBe(true);
    });
  });
});
