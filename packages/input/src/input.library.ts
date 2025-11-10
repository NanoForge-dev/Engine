import { BaseInputLibrary } from "@nanoforge/common";

import { InputHandler } from "./input-handler";
import { type InputEnum } from "./input.enum";

export class InputLibrary extends BaseInputLibrary {
  private _inputHandler?: InputHandler;

  get __name(): string {
    return "InputLibrary";
  }

  public async __init(): Promise<void> {
    this._inputHandler = new InputHandler();
  }

  public isKeyPressed(key: InputEnum): boolean {
    if (!this._inputHandler) this.throwNotInitializedError();
    return this._inputHandler.getKeyStatus(key);
  }

  public getPressedKeys(): InputEnum[] {
    if (!this._inputHandler) this.throwNotInitializedError();
    const res: InputEnum[] = [];
    for (const rawKey in this._inputHandler.inputs) {
      const key = rawKey as InputEnum;
      if (this._inputHandler.getKeyStatus(key)) res.push(key);
    }
    return res;
  }
}
