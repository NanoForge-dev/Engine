import type { InputEnum } from "./input.enum";
import type { DragState, MouseState, WheelState } from "./mouse.types";

/** Public surface of `InputLibrary`, exposed on `Context.input`. */
export interface InputContextApi {
  isKeyPressed(key: InputEnum): boolean | undefined;
  getPressedKeys(): InputEnum[];
  getMousePosition(): { x: number; y: number };
  getMouseState(): MouseState;
  isDragging(button?: InputEnum): boolean;
  getDragState(): DragState;
  getWheelState(): WheelState;
}
