import { BaseInputLibrary, GRAPHICS_LIBRARY } from "@nanoforge-dev/common";

import { InputHandler } from "./input-handler";
import { type InputEnum } from "./input.enum";
import { type DragState, type MouseState, type WheelState } from "./mouse.types";

export class InputLibrary extends BaseInputLibrary {
  private _inputHandler?: InputHandler;

  constructor() {
    super({ runAfter: [GRAPHICS_LIBRARY] });
  }

  get __name(): string {
    return "InputLibrary";
  }

  public override async __init(): Promise<void> {
    this._inputHandler = new InputHandler();
  }

  public async __run() {
    if (!this._inputHandler) this.throwNotInitializedError();
    this._inputHandler.resetPerFrame();
  }

  public isKeyPressed(key: InputEnum): boolean | undefined {
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

  public getMousePosition(): { x: number; y: number } {
    if (!this._inputHandler) this.throwNotInitializedError();
    return this._inputHandler.getMousePosition();
  }

  public getMouseState(): MouseState {
    if (!this._inputHandler) this.throwNotInitializedError();
    return this._inputHandler.mouse;
  }

  public isDragging(button?: InputEnum): boolean {
    if (!this._inputHandler) this.throwNotInitializedError();
    return this._inputHandler.isDragging(button);
  }

  public getDragState(): DragState {
    if (!this._inputHandler) this.throwNotInitializedError();
    return this._inputHandler.drag;
  }

  public getWheelState(): WheelState {
    if (!this._inputHandler) this.throwNotInitializedError();
    return this._inputHandler.wheel;
  }
}
