/**
 * Controller buttons, following the W3C "standard" gamepad layout.
 *
 * @remarks
 * Values are the indices of `Gamepad.buttons` when `Gamepad.mapping` is
 * `"standard"`. Face buttons are named after their Xbox labels: `A` is the
 * bottom face button (Cross on PlayStation), `B` the right one, `X` the left
 * one and `Y` the top one. Use with `ControllerLibrary.isButtonPressed`.
 *
 * @example
 * ```ts
 * if (ctx.controller.isButtonJustPressed(ControllerButton.A)) {
 *   player.jump();
 * }
 * ```
 */
export enum ControllerButton {
  A = 0,
  B = 1,
  X = 2,
  Y = 3,
  LeftBumper = 4,
  RightBumper = 5,
  LeftTrigger = 6,
  RightTrigger = 7,
  Select = 8,
  Start = 9,
  LeftStick = 10,
  RightStick = 11,
  DPadUp = 12,
  DPadDown = 13,
  DPadLeft = 14,
  DPadRight = 15,
  Home = 16,
}

/**
 * Controller axes, following the W3C "standard" gamepad layout.
 *
 * @remarks
 * Values are the indices of `Gamepad.axes` when `Gamepad.mapping` is
 * `"standard"`. Axis values range from `-1` to `1`; negative is left/up.
 */
export enum ControllerAxis {
  LeftStickX = 0,
  LeftStickY = 1,
  RightStickX = 2,
  RightStickY = 3,
}

/** Analog sticks available on a "standard" controller. */
export type ControllerStick = "left" | "right";
