import { InputEnum } from "./input.enum";
import {
  BUTTONS_MASKS,
  type DragState,
  MOUSE_BUTTON_MAP,
  type MouseState,
  type WheelState,
} from "./mouse.types";

export class InputHandler {
  private readonly offset: { x: number; y: number };
  private readonly container: HTMLDivElement;
  public inputs: Record<string, boolean> = {};
  public mouse: MouseState = {
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    deltaX: 0,
    deltaY: 0,
    focus: false,
  };
  public wheel: WheelState = {
    deltaX: 0,
    deltaY: 0,
    deltaZ: 0,
  };
  public drag: DragState = {
    active: false,
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    deltaX: 0,
    deltaY: 0,
  };

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.resetInputs();

    this.offset = container.getBoundingClientRect();

    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    container.addEventListener("mousedown", this.onMouseDown);
    container.addEventListener("mouseup", this.onMouseUp);
    container.addEventListener("mousemove", this.onMouseMove);
    container.addEventListener("wheel", this.onWheel);
    container.addEventListener("mouseenter", this.onMouseEnter);
    container.addEventListener("mouseleave", this.onMouseLeave);
    container.addEventListener("blur", this.onBlur);
    container.addEventListener("visibilitychange", this.onVisibilityChange);

    for (const key in InputEnum) {
      this.inputs[key] = false;
    }
  }

  /** Removes every listener registered by the constructor. */
  public destroy(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.container.removeEventListener("mousedown", this.onMouseDown);
    this.container.removeEventListener("mouseup", this.onMouseUp);
    this.container.removeEventListener("mousemove", this.onMouseMove);
    this.container.removeEventListener("wheel", this.onWheel);
    this.container.removeEventListener("mouseenter", this.onMouseEnter);
    this.container.removeEventListener("mouseleave", this.onMouseLeave);
    this.container.removeEventListener("blur", this.onBlur);
    this.container.removeEventListener("visibilitychange", this.onVisibilityChange);
  }

  public getKeyStatus(key: InputEnum): boolean {
    return this.inputs[key] || false;
  }

  public getMousePosition(): { x: number; y: number } {
    return { x: this.mouse.x, y: this.mouse.y };
  }

  public isDragging(button?: InputEnum): boolean {
    if (!button) return this.drag.active;
    return this.drag.active && this.drag.button === button;
  }

  public resetPerFrame(): void {
    this.mouse.deltaX = 0;
    this.mouse.deltaY = 0;
    this.wheel.deltaX = 0;
    this.wheel.deltaY = 0;
    this.wheel.deltaZ = 0;
  }

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    this.inputs[e.code] = true;
  };

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    this.inputs[e.code] = false;
  };

  private readonly onMouseDown = (e: MouseEvent): void => {
    const button = MOUSE_BUTTON_MAP[e.button];
    if (button === undefined) return;

    this.inputs[button] = true;
    this.updatePointer(e);

    this.drag.active = true;
    this.drag.button = button;
    this.drag.startX = e.clientX - this.offset.x;
    this.drag.startY = e.clientY - this.offset.y;
    this.drag.x = e.clientX - this.offset.x;
    this.drag.y = e.clientY - this.offset.y;
    this.drag.deltaX = 0;
    this.drag.deltaY = 0;
  };

  private readonly onMouseUp = (e: MouseEvent): void => {
    const button = MOUSE_BUTTON_MAP[e.button];
    if (button !== undefined) this.inputs[button] = false;

    this.updatePointer(e);

    if (this.drag.button === button) {
      this.drag.active = false;
      this.drag.button = undefined;
      this.drag.x = 0;
      this.drag.y = 0;
      this.drag.deltaX = 0;
      this.drag.deltaY = 0;
    }
  };

  private readonly onMouseMove = (e: MouseEvent): void => {
    this.updatePointer(e);
    this.updateInputsMouseButtons(e.buttons);

    if (this.drag.active) {
      this.drag.x = e.clientX - this.offset.x;
      this.drag.y = e.clientY - this.offset.y;
      this.drag.deltaX = e.clientX - this.drag.startX - this.offset.x;
      this.drag.deltaY = e.clientY - this.drag.startY - this.offset.y;
    }
  };

  private readonly onWheel = (e: WheelEvent): void => {
    this.wheel.deltaX += e.deltaX;
    this.wheel.deltaY += e.deltaY;
    this.wheel.deltaZ += e.deltaZ;
  };

  private readonly onMouseEnter = (): void => {
    this.mouse.focus = true;
  };

  private readonly onMouseLeave = (): void => {
    this.mouse.focus = false;
  };

  private readonly onBlur = (): void => {
    this.resetInputs();
  };

  private readonly onVisibilityChange = (): void => {
    if (document.hidden) this.resetInputs();
  };

  private updatePointer(e: MouseEvent): void {
    this.mouse.prevX = this.mouse.x;
    this.mouse.prevY = this.mouse.y;
    this.mouse.x = e.clientX - this.offset.x;
    this.mouse.y = e.clientY - this.offset.y;
    this.mouse.deltaX = this.mouse.x - this.mouse.prevX;
    this.mouse.deltaY = this.mouse.y - this.mouse.prevY;
  }

  private updateInputsMouseButtons(buttons: number): void {
    for (const [mask, input] of BUTTONS_MASKS) {
      this.inputs[input] = (buttons & mask) !== 0;
    }
  }

  private resetInputs(): void {
    for (const key of Object.values(InputEnum)) {
      this.inputs[key] = false;
    }

    this.drag.active = false;
    this.drag.button = undefined;
    this.drag.startX = 0;
    this.drag.startY = 0;
    this.drag.x = 0;
    this.drag.y = 0;
    this.drag.deltaX = 0;
    this.drag.deltaY = 0;

    this.wheel.deltaX = 0;
    this.wheel.deltaY = 0;
    this.wheel.deltaZ = 0;

    this.mouse.deltaX = 0;
    this.mouse.deltaY = 0;
    this.mouse.focus = false;
  }
}
