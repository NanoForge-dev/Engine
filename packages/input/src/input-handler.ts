import { InputEnum, MouseEnum } from "./input.enum";

export class InputHandler {
  public inputs: Record<string, boolean> = {};

  constructor() {
    window.addEventListener("keydown", (e: KeyboardEvent) => {
      this.inputs[e.code] = true;
    });

    window.addEventListener("keyup", (e: KeyboardEvent) => {
      this.inputs[e.code] = false;
    });

    window.addEventListener("mousedown", (e: MouseEvent) => {
      const mouseButton = MouseEnum[e.button];
      if (!mouseButton) return;

      this.inputs[mouseButton] = true;
    });

    window.addEventListener("mouseup", (e: MouseEvent) => {
      const mouseButton = MouseEnum[e.button];
      if (!mouseButton) return;

      this.inputs[mouseButton] = false;
    });

    for (const key in InputEnum) {
      this.inputs[key] = false;
    }
  }

  getKeyStatus(key: InputEnum): boolean {
    return this.inputs[key] || false;
  }
}
