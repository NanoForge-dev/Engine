import { type InitContext, Library, defineLibraryKey } from "@nanoforge-dev/common";

import type { InputContextApi } from "./input-context.type";
import { InputHandler } from "./input-handler";
import type { InputEnum } from "./input.enum";
import type { DragState, MouseState, WheelState } from "./mouse.types";

/**
 * Built-in input library.
 *
 * @remarks
 * Listens to browser `keydown`/`keyup` (on `window`) and `mousedown`/
 * `mouseup`/`mousemove`/`wheel`/`mouseenter`/`mouseleave`/`blur`/
 * `visibilitychange` (on the client container) and exposes a per-frame
 * snapshot of the current input state on `Context.input`. Client-only —
 * `__init` throws if `InitContext.container` is missing.
 */
export class InputLibrary extends Library {
  readonly key = defineLibraryKey("input");

  private _inputHandler?: InputHandler;

  constructor() {
    super({ runAfter: ["graphics"] });
  }

  public override async __init(ctx: InitContext): Promise<void> {
    if (!ctx.container) {
      throw new Error(
        "InputLibrary must be registered on the client (InitContext must contain a container element).",
      );
    }
    this._inputHandler = new InputHandler(ctx.container);
  }

  public override async __run(): Promise<void> {
    if (!this._inputHandler) this.throwNotInitializedError();
    this._inputHandler.resetPerFrame();
  }

  public override async __clear(): Promise<void> {
    this._inputHandler?.destroy();
  }

  /**
   * @returns `true`/`false` for a held/released key, `undefined` if the key
   * has never been seen.
   */
  public isKeyPressed(key: InputEnum): boolean | undefined {
    if (!this._inputHandler) this.throwNotInitializedError();
    return this._inputHandler.getKeyStatus(key);
  }

  public getPressedKeys(): InputEnum[] {
    if (!this._inputHandler) this.throwNotInitializedError();
    const pressed: InputEnum[] = [];
    for (const rawKey in this._inputHandler.inputs) {
      const key = rawKey as InputEnum;
      if (this._inputHandler.getKeyStatus(key)) pressed.push(key);
    }
    return pressed;
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

  public override expose(): InputContextApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const library = this;
    return {
      isKeyPressed: (key) => library.isKeyPressed(key),
      getPressedKeys: () => library.getPressedKeys(),
      getMousePosition: () => library.getMousePosition(),
      getMouseState: () => library.getMouseState(),
      isDragging: (button) => library.isDragging(button),
      getDragState: () => library.getDragState(),
      getWheelState: () => library.getWheelState(),
    };
  }
}
