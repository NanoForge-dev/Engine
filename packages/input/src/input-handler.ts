import { type InputEnum } from "./input.enum";

export class InputHandler {
  public inputs: Record<string, boolean> = {};

  constructor() {
    window.addEventListener("keydown", (e: KeyboardEvent) => {
      this.inputs[e.code] = true;
    });

    window.addEventListener("keyup", (e: KeyboardEvent) => {
      this.inputs[e.code] = false;
    });
  }

  getKeyStatus(key: InputEnum): boolean {
    return this.inputs[key];
  }
}
