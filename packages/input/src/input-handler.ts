import { InputEnum } from "./input.enum";

export class InputHandler {
  public inputs: Record<string, boolean> = {};

  constructor() {
    window.addEventListener("keydown", (e: KeyboardEvent) => {
      this.inputs[e.code] = true;
    });

    window.addEventListener("keyup", (e: KeyboardEvent) => {
      this.inputs[e.code] = false;
    });

    for (const key in InputEnum) {
      this.inputs[key] = false;
    }
  }

  getKeyStatus(key: InputEnum): boolean | undefined {
    return this.inputs[key];
  }
}
