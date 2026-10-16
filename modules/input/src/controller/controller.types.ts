import type { ButtonState } from "../shared";

/** State of a single controller button for the current frame. */
export type ControllerButtonState = ButtonState & {
  /** Analog value between `0` and `1` (e.g. how far a trigger is pulled). */
  value: number;
};

/**
 * Snapshot of a connected controller for the current frame.
 *
 * @remarks
 * Returned by `ControllerLibrary.getControllers` and `ControllerLibrary.getController`.
 * `axes` are the raw values reported by the browser, without deadzone.
 */
export type ControllerState = {
  /** Slot of the controller, as given by `Gamepad.index`. */
  index: number;
  /** Browser-provided identifier of the device. */
  id: string;
  /** `"standard"` when `ControllerButton`/`ControllerAxis` apply, `""` otherwise. */
  mapping: GamepadMappingType;
  /** Button states, indexed like `Gamepad.buttons`. */
  buttons: ControllerButtonState[];
  /** Raw axis values between `-1` and `1`, indexed like `Gamepad.axes`. */
  axes: number[];
};

/** Position of an analog stick, each component between `-1` and `1`. */
export type StickPosition = {
  x: number;
  y: number;
};

/** Rumble effect played by `ControllerLibrary.vibrate`. */
export type ControllerVibration = {
  /** Duration of the effect, in milliseconds. */
  duration: number;
  /** Intensity of the low-frequency motor, between `0` and `1`. Defaults to `1`. */
  strongMagnitude?: number;
  /** Intensity of the high-frequency motor, between `0` and `1`. Defaults to `1`. */
  weakMagnitude?: number;
};

/** Called when a controller is connected or disconnected. */
export type ControllerListener = (controller: ControllerState) => void;

/** Options accepted by the `ControllerLibrary` constructor. */
export type ControllerLibraryOptions = {
  /**
   * Axis values whose magnitude is below this threshold are reported as `0`
   * by `getAxis` and `getStick`. Must be in `[0, 1)`. Defaults to `0.15`.
   */
  deadzone?: number;
};
