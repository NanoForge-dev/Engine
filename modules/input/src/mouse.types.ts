import { InputEnum } from "./input.enum";

/**
 * Snapshot of mouse cursor state for the current frame.
 *
 * @remarks
 * Returned by `InputLibrary.getMouseState`.  `deltaX` / `deltaY` are
 * reset to `0` at the beginning of each frame.
 */
export type MouseState = {
  /** Current horizontal cursor position in CSS pixels. */
  x: number;
  /** Current vertical cursor position in CSS pixels. */
  y: number;
  /** Horizontal cursor position from the previous frame. */
  prevX: number;
  /** Vertical cursor position from the previous frame. */
  prevY: number;
  /** Horizontal movement since the previous frame. */
  deltaX: number;
  /** Vertical movement since the previous frame. */
  deltaY: number;
  /** `true` while the cursor is inside the game window. */
  focus: boolean;
};

/**
 * Snapshot of the current drag operation.
 *
 * @remarks
 * Returned by `InputLibrary.getDragState`.  A drag becomes active on
 * `mousedown` and inactive on `mouseup`.
 */
export type DragState = {
  /** `true` when a drag is in progress. */
  active: boolean;
  /** The mouse button that initiated the drag, or `undefined` when inactive. */
  button?: InputEnum | undefined;
  /** Horizontal cursor position when the drag started. */
  startX: number;
  /** Vertical cursor position when the drag started. */
  startY: number;
  /** Current horizontal cursor position during the drag. */
  x: number;
  /** Current vertical cursor position during the drag. */
  y: number;
  /** Total horizontal distance dragged from the start position. */
  deltaX: number;
  /** Total vertical distance dragged from the start position. */
  deltaY: number;
};

/**
 * Snapshot of the scroll wheel state for the current frame.
 *
 * @remarks
 * Returned by `InputLibrary.getWheelState`.  All deltas accumulate
 * within the frame and are reset to `0` at the start of the next frame.
 */
export type WheelState = {
  /** Accumulated horizontal scroll delta. */
  deltaX: number;
  /** Accumulated vertical scroll delta. */
  deltaY: number;
  /** Accumulated depth (z-axis) scroll delta. */
  deltaZ: number;
};

export const MOUSE_BUTTON_MAP: Partial<Record<number, InputEnum>> = {
  0: InputEnum.MouseLeft,
  1: InputEnum.MouseMiddle,
  2: InputEnum.MouseRight,
  3: InputEnum.Back,
  4: InputEnum.Forward,
};

export const BUTTONS_MASKS = new Map<number, InputEnum>([
  [1, InputEnum.MouseLeft],
  [2, InputEnum.MouseRight],
  [4, InputEnum.MouseMiddle],
  [8, InputEnum.Back],
  [16, InputEnum.Forward],
]);
