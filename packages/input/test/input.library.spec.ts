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
    dispatch: (event: string, e: Partial<MockInputEvent>) => {
      listeners[event]?.forEach((h) => h(e as MockInputEvent));
    },
  };
};

describe("InputLibrary", () => {
  let windowMock: ReturnType<typeof makeEventTargetMock>;
  let documentMock: ReturnType<typeof makeEventTargetMock> & { hidden: boolean };

  beforeEach(() => {
    windowMock = makeEventTargetMock();
    documentMock = {
      ...makeEventTargetMock(),
      hidden: false,
    };

    vi.stubGlobal("window", windowMock);
    vi.stubGlobal("document", documentMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("metadata", () => {
    it("should expose the correct library name", () => {
      expect(new InputLibrary().__name).toBe("InputLibrary");
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

    it("should throw when __run is called before __init", async () => {
      const library = new InputLibrary();

      await expect(library.__run()).rejects.toThrow();
    });
  });

  describe("after initialization", () => {
    let library: InputLibrary;

    beforeEach(async () => {
      library = new InputLibrary();
      await library.__init();
    });

    it("should register all expected event listeners", () => {
      expect(windowMock.addEventListener).toHaveBeenCalledWith("keydown", expect.any(Function));
      expect(windowMock.addEventListener).toHaveBeenCalledWith("keyup", expect.any(Function));
      expect(windowMock.addEventListener).toHaveBeenCalledWith("mousedown", expect.any(Function));
      expect(windowMock.addEventListener).toHaveBeenCalledWith("mouseup", expect.any(Function));
      expect(windowMock.addEventListener).toHaveBeenCalledWith("mousemove", expect.any(Function));
      expect(windowMock.addEventListener).toHaveBeenCalledWith("wheel", expect.any(Function));
      expect(windowMock.addEventListener).toHaveBeenCalledWith("mouseenter", expect.any(Function));
      expect(windowMock.addEventListener).toHaveBeenCalledWith("mouseleave", expect.any(Function));
      expect(windowMock.addEventListener).toHaveBeenCalledWith("blur", expect.any(Function));
      expect(documentMock.addEventListener).toHaveBeenCalledWith(
        "visibilitychange",
        expect.any(Function),
      );
    });

    it("should return false for any key before any key event", () => {
      expect(library.isKeyPressed(InputEnum.KeyA)).toBe(false);
      expect(library.isKeyPressed(InputEnum.Space)).toBe(false);
      expect(library.isKeyPressed(InputEnum.Enter)).toBe(false);
    });

    it("should return an empty pressed keys list when no key is down", () => {
      expect(library.getPressedKeys()).toStrictEqual([]);
    });

    it("should return true for a key after a keydown event", () => {
      windowMock.dispatch("keydown", { code: InputEnum.KeyA });
      expect(library.isKeyPressed(InputEnum.KeyA)).toBe(true);
    });

    it("should return false for a key after keydown then keyup", () => {
      windowMock.dispatch("keydown", { code: InputEnum.KeyA });
      windowMock.dispatch("keyup", { code: InputEnum.KeyA });
      expect(library.isKeyPressed(InputEnum.KeyA)).toBe(false);
    });

    it("should list all currently pressed keys", () => {
      windowMock.dispatch("keydown", { code: InputEnum.KeyA });
      windowMock.dispatch("keydown", { code: InputEnum.Space });
      const pressed = library.getPressedKeys();
      expect(pressed).toContain(InputEnum.KeyA);
      expect(pressed).toContain(InputEnum.Space);
      expect(pressed.length).toBe(2);
    });

    it("should remove a released key from pressed keys", () => {
      windowMock.dispatch("keydown", { code: InputEnum.KeyA });
      windowMock.dispatch("keydown", { code: InputEnum.Space });
      windowMock.dispatch("keyup", { code: InputEnum.KeyA });
      const pressed = library.getPressedKeys();
      expect(pressed).not.toContain(InputEnum.KeyA);
      expect(pressed).toContain(InputEnum.Space);
    });

    it("should handle mouse button press and release", () => {
      windowMock.dispatch("mousedown", { button: 0, clientX: 10, clientY: 20 });
      expect(library.isKeyPressed(InputEnum.MouseLeft)).toBe(true);

      windowMock.dispatch("mouseup", { button: 0, clientX: 10, clientY: 20 });
      expect(library.isKeyPressed(InputEnum.MouseLeft)).toBe(false);
    });

    it("should handle unknown mouse input", () => {
      windowMock.dispatch("mousedown", { button: -2 });
      windowMock.dispatch("mousedown", { button: 999 });
      windowMock.dispatch("mouseup", { button: 999 });

      const pressed = library.getPressedKeys();

      expect(pressed).toHaveLength(0);
    });

    it("should update mouse position and state on move", () => {
      windowMock.dispatch("mousemove", { clientX: 100, clientY: 200, buttons: 0 });

      expect(library.getMousePosition()).toStrictEqual({ x: 100, y: 200 });
      expect(library.getMouseState()).toMatchObject({
        x: 100,
        y: 200,
        deltaX: 100,
        deltaY: 200,
      });
    });

    it("should start, update and stop dragging", () => {
      windowMock.dispatch("mousedown", { button: 0, clientX: 10, clientY: 20 });
      expect(library.isDragging()).toBe(true);
      expect(library.isDragging(InputEnum.MouseLeft)).toBe(true);

      windowMock.dispatch("mousemove", { clientX: 25, clientY: 45, buttons: 1 });
      expect(library.getDragState()).toMatchObject({
        active: true,
        startX: 10,
        startY: 20,
        x: 25,
        y: 45,
        deltaX: 15,
        deltaY: 25,
      });

      windowMock.dispatch("mouseup", { button: 0, clientX: 25, clientY: 45 });
      expect(library.isDragging()).toBe(false);
      expect(library.getDragState()).toMatchObject({
        active: false,
        deltaX: 0,
        deltaY: 0,
      });
    });

    it("should accumulate wheel delta", () => {
      windowMock.dispatch("wheel", { deltaX: 1, deltaY: 2, deltaZ: 3 });
      windowMock.dispatch("wheel", { deltaX: 4, deltaY: 5, deltaZ: 6 });

      expect(library.getWheelState()).toStrictEqual({
        deltaX: 5,
        deltaY: 7,
        deltaZ: 9,
      });
    });

    it("should reset per frame on __run", async () => {
      windowMock.dispatch("mousemove", { clientX: 10, clientY: 20, buttons: 0 });
      windowMock.dispatch("wheel", { deltaX: 1, deltaY: 2, deltaZ: 3 });

      await library.__run();

      expect(library.getMouseState()).toMatchObject({
        deltaX: 0,
        deltaY: 0,
      });
      expect(library.getWheelState()).toStrictEqual({
        deltaX: 0,
        deltaY: 0,
        deltaZ: 0,
      });
    });

    it("should reset inputs on blur", () => {
      windowMock.dispatch("keydown", { code: InputEnum.KeyA });
      windowMock.dispatch("mousedown", { button: 0, clientX: 10, clientY: 20 });
      windowMock.dispatch("wheel", { deltaX: 1, deltaY: 2, deltaZ: 3 });

      windowMock.dispatch("blur", {});

      expect(library.isKeyPressed(InputEnum.KeyA)).toBe(false);
      expect(library.isKeyPressed(InputEnum.MouseLeft)).toBe(false);
      expect(library.isDragging()).toBe(false);
      expect(library.getWheelState()).toStrictEqual({
        deltaX: 0,
        deltaY: 0,
        deltaZ: 0,
      });
    });

    it("should reset inputs when document becomes hidden", () => {
      windowMock.dispatch("keydown", { code: InputEnum.KeyA });
      documentMock.hidden = true;

      documentMock.dispatch("visibilitychange", {});

      expect(library.isKeyPressed(InputEnum.KeyA)).toBe(false);
    });

    it("should update pointer focus on mouse enter and leave", () => {
      windowMock.dispatch("mouseenter", {});
      expect(library.getMouseState().focus).toBe(true);

      windowMock.dispatch("mouseleave", {});
      expect(library.getMouseState().focus).toBe(false);
    });

    it("should fully reset drag state when the released button matches the active drag button", () => {
      windowMock.dispatch("mousedown", { button: 0, clientX: 10, clientY: 20 });
      windowMock.dispatch("mousemove", { clientX: 30, clientY: 50, buttons: 1 });

      expect(library.getDragState()).toMatchObject({
        active: true,
        button: InputEnum.MouseLeft,
        x: 30,
        y: 50,
        deltaX: 20,
        deltaY: 30,
      });

      windowMock.dispatch("mouseup", { button: 0, clientX: 30, clientY: 50 });

      expect(library.getDragState()).toMatchObject({
        active: false,
        button: undefined,
        x: 0,
        y: 0,
        deltaX: 0,
        deltaY: 0,
      });
    });

    it("should not reset inputs when visibility changes but document is not hidden", () => {
      windowMock.dispatch("keydown", { code: InputEnum.KeyA });
      documentMock.hidden = false;

      documentMock.dispatch("visibilitychange", {});

      expect(library.isKeyPressed(InputEnum.KeyA)).toBe(true);
    });

    it("should keep drag active when mouseup button does not match active drag button", () => {
      windowMock.dispatch("mousedown", { button: 0, clientX: 10, clientY: 20 });

      expect(library.getDragState()).toMatchObject({
        active: true,
        button: InputEnum.MouseLeft,
        startX: 10,
        startY: 20,
      });

      windowMock.dispatch("mouseup", { button: 2, clientX: 15, clientY: 25 });

      expect(library.getDragState()).toMatchObject({
        active: true,
        button: InputEnum.MouseLeft,
        startX: 10,
        startY: 20,
      });
    });
  });
});
