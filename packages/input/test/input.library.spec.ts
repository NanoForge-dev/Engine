import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { InputEnum, InputLibrary } from "../src";

type MockInputEvent = {
  code?: string;
  button?: number;
};

const makeWindowMock = () => {
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
  let windowMock: ReturnType<typeof makeWindowMock>;

  beforeEach(() => {
    windowMock = makeWindowMock();
    vi.stubGlobal("window", windowMock);
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
    it("should throw when isKeyPressed is called before __init", () => {
      const library = new InputLibrary();
      expect(() => library.isKeyPressed(InputEnum.KeyA)).toThrow();
    });

    it("should throw when getPressedKeys is called before __init", () => {
      const library = new InputLibrary();
      expect(() => library.getPressedKeys()).toThrow();
    });
  });

  describe("after initialization", () => {
    let library: InputLibrary;

    beforeEach(async () => {
      library = new InputLibrary();
      await library.__init();
    });

    it("should register keydown and keyup event listeners", () => {
      expect(windowMock.addEventListener).toHaveBeenCalledWith("keydown", expect.any(Function));
      expect(windowMock.addEventListener).toHaveBeenCalledWith("keyup", expect.any(Function));
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

    it("should return true for left mouse after mousedown", () => {
      windowMock.dispatch("mousedown", { button: 0 });
      expect(library.isKeyPressed(InputEnum.MouseLeft)).toBe(true);
    });

    it("should return false for left mouse after mousedown then mouseup", () => {
      windowMock.dispatch("mousedown", { button: 0 });
      windowMock.dispatch("mouseup", { button: 0 });
      expect(library.isKeyPressed(InputEnum.MouseLeft)).toBe(false);
    });

    it("should track right mouse independently", () => {
      windowMock.dispatch("mousedown", { button: 2 });

      expect(library.isKeyPressed(InputEnum.MouseRight)).toBe(true);
      expect(library.isKeyPressed(InputEnum.MouseLeft)).toBe(false);
    });

    it("should include mouse input in pressed keys when mouse is held", () => {
      windowMock.dispatch("mousedown", { button: 0 });

      const pressed = library.getPressedKeys();

      expect(pressed).toContain(InputEnum.MouseLeft);
    });

    it("should remove mouse input from pressed keys after mouseup", () => {
      windowMock.dispatch("mousedown", { button: 0 });
      windowMock.dispatch("mouseup", { button: 0 });

      const pressed = library.getPressedKeys();

      expect(pressed).not.toContain(InputEnum.MouseLeft);
    });

    it("should handle unknown mouse input", () => {
      windowMock.dispatch("mousedown", { button: -2 });
      windowMock.dispatch("mousedown", { button: 999 });
      windowMock.dispatch("mouseup", { button: 999 });

      const pressed = library.getPressedKeys();

      expect(pressed).toHaveLength(0);
    });
  });
});
