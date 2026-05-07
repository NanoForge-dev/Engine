import { InputEnum } from "./input.enum";
import {
  BUTTONS_MASKS,
  type DragState,
  MOUSE_BUTTON_MAP,
  type MouseState,
  type WheelState,
} from "./mouse.types";

export class InputHandler {
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

  constructor() {
    this.resetInputs();

    window.addEventListener("keydown", (e: KeyboardEvent) => {
      this.inputs[e.code] = true;
    });

    window.addEventListener("keyup", (e: KeyboardEvent) => {
      this.inputs[e.code] = false;
    });

    window.addEventListener("mousedown", (e: MouseEvent) => {
      const button = MOUSE_BUTTON_MAP[e.button];
      if (button === undefined) return;

      this.inputs[button] = true;
      this.updatePointer(e);

      this.drag.active = true;
      this.drag.button = button;
      this.drag.startX = e.clientX;
      this.drag.startY = e.clientY;
      this.drag.x = e.clientX;
      this.drag.y = e.clientY;
      this.drag.deltaX = 0;
      this.drag.deltaY = 0;
    });

    window.addEventListener("mouseup", (e: MouseEvent) => {
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
    });

    window.addEventListener("mousemove", (e: MouseEvent) => {
      this.updatePointer(e);
      this.updateInputsMouseButtons(e.buttons);

      if (this.drag.active) {
        this.drag.x = e.clientX;
        this.drag.y = e.clientY;
        this.drag.deltaX = e.clientX - this.drag.startX;
        this.drag.deltaY = e.clientY - this.drag.startY;
      }
    });

    window.addEventListener("wheel", (e: WheelEvent) => {
      this.wheel.deltaX += e.deltaX;
      this.wheel.deltaY += e.deltaY;
      this.wheel.deltaZ += e.deltaZ;
    });

    window.addEventListener("mouseenter", () => {
      this.mouse.focus = true;
    });

    window.addEventListener("mouseleave", () => {
      this.mouse.focus = false;
    });

    window.addEventListener("blur", () => {
      this.resetInputs();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.resetInputs();
    });

    for (const key in InputEnum) {
      this.inputs[key] = false;
    }
  }

  public getKeyStatus(key: InputEnum): boolean {
    return this.inputs[key] || false;
  }

  public getMousePosition() {
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

  private updatePointer(e: MouseEvent): void {
    this.mouse.prevX = this.mouse.x;
    this.mouse.prevY = this.mouse.y;
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
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
