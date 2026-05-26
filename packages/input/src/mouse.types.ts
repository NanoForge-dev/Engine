import { InputEnum } from "./input.enum";

export type MouseState = {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  deltaX: number;
  deltaY: number;
  focus: boolean;
};

export type DragState = {
  active: boolean;
  button?: InputEnum | undefined;
  startX: number;
  startY: number;
  x: number;
  y: number;
  deltaX: number;
  deltaY: number;
};

export type WheelState = { deltaX: number; deltaY: number; deltaZ: number };

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
