/**
 * State of a digital button for the current frame.
 *
 * @remarks
 * `justPressed` / `justReleased` are `true` only on the frame where the
 * transition happened.
 */
export type ButtonState = {
  /** `true` while the button is held. */
  pressed: boolean;
  /** `true` on the frame the button went down. */
  justPressed: boolean;
  /** `true` on the frame the button went up. */
  justReleased: boolean;
};

/** Computes this frame's `ButtonState` from the current reading and the previous frame. */
export const nextButtonState = (pressed: boolean, wasPressed = false): ButtonState => ({
  pressed,
  justPressed: pressed && !wasPressed,
  justReleased: !pressed && wasPressed,
});
