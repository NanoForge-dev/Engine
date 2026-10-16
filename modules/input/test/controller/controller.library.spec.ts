import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ControllerAxis, ControllerButton, ControllerLibrary } from "../../src/controller";

type MockGamepad = {
  index: number;
  id: string;
  mapping: GamepadMappingType;
  connected: boolean;
  buttons: { pressed: boolean; value: number }[];
  axes: number[];
  vibrationActuator?: { playEffect: ReturnType<typeof vi.fn> } | null;
};

const makeGamepad = (index = 0): MockGamepad => ({
  index,
  id: `Mock controller ${index}`,
  mapping: "standard",
  connected: true,
  buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
  axes: [0, 0, 0, 0],
});

const press = (gamepad: MockGamepad, button: ControllerButton, value = 1): void => {
  gamepad.buttons[button] = { pressed: value > 0, value };
};

const makeWindowMock = () => {
  const listeners: Record<string, ((e: { gamepad: MockGamepad }) => void)[]> = {};
  return {
    addEventListener: vi.fn((event: string, handler: (e: { gamepad: MockGamepad }) => void) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    }),
    removeEventListener: vi.fn((event: string, handler: (e: { gamepad: MockGamepad }) => void) => {
      listeners[event] = (listeners[event] ?? []).filter((h) => h !== handler);
    }),
    dispatch: (event: string, gamepad: MockGamepad) => {
      listeners[event]?.forEach((h) => h({ gamepad }));
    },
  };
};

describe("ControllerLibrary", () => {
  let windowMock: ReturnType<typeof makeWindowMock>;
  let gamepads: (MockGamepad | null)[];

  beforeEach(() => {
    windowMock = makeWindowMock();
    gamepads = [null, null, null, null];
    vi.stubGlobal("window", windowMock);
    vi.stubGlobal("navigator", { getGamepads: () => gamepads });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const init = async (options?: ConstructorParameters<typeof ControllerLibrary>[0]) => {
    const library = new ControllerLibrary(options);
    await library.__init();
    return library;
  };

  // __run ignores its context argument.
  const tick = (library: ControllerLibrary) => library.__run({} as never);

  describe("metadata", () => {
    it("should use the controller key", () => {
      expect(new ControllerLibrary().key).toBe("controller");
    });

    it("should reject an out-of-range deadzone", () => {
      expect(() => new ControllerLibrary({ deadzone: 1 })).toThrow(RangeError);
      expect(() => new ControllerLibrary({ deadzone: -0.1 })).toThrow(RangeError);
    });
  });

  describe("lifecycle", () => {
    it("should throw before __init", () => {
      expect(() => new ControllerLibrary().isButtonPressed(ControllerButton.A)).toThrow();
    });

    it("should throw on __init when the Gamepad API is unavailable", async () => {
      vi.stubGlobal("navigator", {});
      await expect(new ControllerLibrary().__init()).rejects.toThrow(/Gamepad API/);
    });

    it("should remove its window listeners on __clear", async () => {
      const library = await init();
      await library.__clear({} as never);
      expect(windowMock.removeEventListener).toHaveBeenCalledWith(
        "gamepadconnected",
        expect.any(Function),
      );
      expect(windowMock.removeEventListener).toHaveBeenCalledWith(
        "gamepaddisconnected",
        expect.any(Function),
      );
    });
  });

  describe("connection", () => {
    it("should detect a controller through polling", async () => {
      const library = await init();
      expect(library.isConnected()).toBe(false);

      gamepads[0] = makeGamepad(0);
      await tick(library);

      expect(library.isConnected()).toBe(true);
      expect(library.getControllers()).toHaveLength(1);
      expect(library.getController()?.id).toBe("Mock controller 0");
    });

    it("should notify connect and disconnect listeners once", async () => {
      const library = await init();
      const onConnect = vi.fn();
      const onDisconnect = vi.fn();
      library.onConnect(onConnect);
      library.onDisconnect(onDisconnect);

      const gamepad = makeGamepad(1);
      gamepads[1] = gamepad;
      windowMock.dispatch("gamepadconnected", gamepad);
      await tick(library);
      expect(onConnect).toHaveBeenCalledTimes(1);
      expect(onConnect).toHaveBeenCalledWith(expect.objectContaining({ index: 1 }));

      gamepads[1] = null;
      windowMock.dispatch("gamepaddisconnected", gamepad);
      await tick(library);
      expect(onDisconnect).toHaveBeenCalledTimes(1);
      expect(library.isConnected(1)).toBe(false);
    });

    it("should stop notifying an unsubscribed listener", async () => {
      const library = await init();
      const onConnect = vi.fn();
      library.onConnect(onConnect)();

      gamepads[0] = makeGamepad(0);
      await tick(library);
      expect(onConnect).not.toHaveBeenCalled();
    });
  });

  describe("buttons", () => {
    it("should report just pressed / just released on a single frame", async () => {
      const library = await init();
      const gamepad = makeGamepad(0);
      gamepads[0] = gamepad;
      await tick(library);

      press(gamepad, ControllerButton.A);
      await tick(library);
      expect(library.isButtonPressed(ControllerButton.A)).toBe(true);
      expect(library.isButtonJustPressed(ControllerButton.A)).toBe(true);

      await tick(library);
      expect(library.isButtonPressed(ControllerButton.A)).toBe(true);
      expect(library.isButtonJustPressed(ControllerButton.A)).toBe(false);

      press(gamepad, ControllerButton.A, 0);
      await tick(library);
      expect(library.isButtonPressed(ControllerButton.A)).toBe(false);
      expect(library.isButtonJustReleased(ControllerButton.A)).toBe(true);

      await tick(library);
      expect(library.isButtonJustReleased(ControllerButton.A)).toBe(false);
    });

    it("should expose analog button values", async () => {
      const library = await init();
      const gamepad = makeGamepad(0);
      press(gamepad, ControllerButton.RightTrigger, 0.4);
      gamepads[0] = gamepad;
      await tick(library);

      expect(library.getButtonValue(ControllerButton.RightTrigger)).toBe(0.4);
    });

    it("should keep controllers independent", async () => {
      const library = await init();
      const second = makeGamepad(1);
      press(second, ControllerButton.Start);
      gamepads[0] = makeGamepad(0);
      gamepads[1] = second;
      await tick(library);

      expect(library.isButtonPressed(ControllerButton.Start, 0)).toBe(false);
      expect(library.isButtonPressed(ControllerButton.Start, 1)).toBe(true);
    });

    it("should return neutral values for a missing controller", async () => {
      const library = await init();
      expect(library.isButtonPressed(ControllerButton.A, 3)).toBe(false);
      expect(library.getButtonValue(ControllerButton.A, 3)).toBe(0);
      expect(library.getAxis(ControllerAxis.LeftStickX, 3)).toBe(0);
      expect(library.getStick("left", 3)).toEqual({ x: 0, y: 0 });
    });
  });

  describe("axes", () => {
    it("should apply the deadzone and rescale axis values", async () => {
      const library = await init({ deadzone: 0.2 });
      const gamepad = makeGamepad(0);
      gamepads[0] = gamepad;

      gamepad.axes = [0.1, -0.6, 1, 0];
      await tick(library);

      expect(library.getAxis(ControllerAxis.LeftStickX)).toBe(0);
      expect(library.getAxis(ControllerAxis.LeftStickY)).toBeCloseTo(-0.5);
      expect(library.getAxis(ControllerAxis.RightStickX)).toBeCloseTo(1);
      expect(library.getController()?.axes[0]).toBe(0.1);
    });

    it("should apply a radial deadzone to sticks", async () => {
      const library = await init({ deadzone: 0.2 });
      const gamepad = makeGamepad(0);
      gamepads[0] = gamepad;

      gamepad.axes = [0.1, 0.1, 0.6, 0.8];
      await tick(library);

      expect(library.getStick("left")).toEqual({ x: 0, y: 0 });
      const right = library.getStick("right");
      expect(Math.hypot(right.x, right.y)).toBeCloseTo(1);
      expect(right.x / right.y).toBeCloseTo(0.75);
    });
  });

  describe("vibrate", () => {
    it("should play a dual-rumble effect when supported", async () => {
      const library = await init();
      const playEffect = vi.fn().mockResolvedValue("complete");
      gamepads[0] = { ...makeGamepad(0), vibrationActuator: { playEffect } };

      await expect(library.vibrate({ duration: 200, weakMagnitude: 0.5 })).resolves.toBe(true);
      expect(playEffect).toHaveBeenCalledWith("dual-rumble", {
        duration: 200,
        strongMagnitude: 1,
        weakMagnitude: 0.5,
      });
    });

    it("should resolve false without vibration support", async () => {
      const library = await init();
      gamepads[0] = { ...makeGamepad(0), vibrationActuator: null };
      await expect(library.vibrate({ duration: 200 })).resolves.toBe(false);
      await expect(library.vibrate({ duration: 200 }, 2)).resolves.toBe(false);
    });
  });

  describe("expose", () => {
    it("should forward the context API to the library", async () => {
      const library = await init();
      const gamepad = makeGamepad(0);
      press(gamepad, ControllerButton.B);
      gamepads[0] = gamepad;
      await tick(library);

      const api = library.expose();
      expect(api.isConnected()).toBe(true);
      expect(api.isButtonPressed(ControllerButton.B)).toBe(true);
      expect(api.isButtonJustPressed(ControllerButton.B)).toBe(true);
    });
  });
});
