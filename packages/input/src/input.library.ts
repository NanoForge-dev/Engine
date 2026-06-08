import { BaseInputLibrary, GRAPHICS_LIBRARY } from "@nanoforge-dev/common";

import { InputHandler } from "./input-handler";
import { type InputEnum } from "./input.enum";
import { type DragState, type MouseState, type WheelState } from "./mouse.types";

/**
 * Built-in input library.
 *
 * @remarks
 * Listens to browser `keydown`, `keyup`, `mousedown`, `mouseup`, `mousemove`,
 * and `wheel` events and exposes a per-frame snapshot of the current input
 * state.  Must be registered after the graphics library because it uses
 * `runAfter: [GRAPHICS_LIBRARY]`.
 *
 * Register with the application:
 * ```ts
 * client.useInput(new InputLibrary());
 * ```
 *
 * Access in a system's `__run` hook:
 * ```ts
 * const input = ctx.libraries.getInput<InputLibrary>().library;
 * if (input.isKeyPressed(InputEnum.Space)) player.jump();
 * ```
 */
export class InputLibrary extends BaseInputLibrary {
  private _inputHandler?: InputHandler;

  constructor() {
    super({ runAfter: [GRAPHICS_LIBRARY] });
  }

  /** @internal */
  get __name(): string {
    return "InputLibrary";
  }

  /** @internal */
  public override async __init(): Promise<void> {
    this._inputHandler = new InputHandler();
  }

  /** @internal */
  public override async __run() {
    if (!this._inputHandler) this.throwNotInitializedError();
    this._inputHandler.resetPerFrame();
  }

  /**
   * Return whether a key or mouse button is currently held down.
   *
   * @param key - The key or button to query (see InputEnum).
   * @returns `true` when the key is pressed, `false` when released,
   *   `undefined` when the key has never been seen.
   * @throws `NfNotInitializedException` When called before `__init` has resolved.
   */
  public isKeyPressed(key: InputEnum): boolean | undefined {
    if (!this._inputHandler) this.throwNotInitializedError();
    return this._inputHandler.getKeyStatus(key);
  }

  /**
   * Return a list of all keys and mouse buttons that are currently pressed.
   *
   * @returns Array of `InputEnum` values for all currently-down inputs.
   * @throws `NfNotInitializedException` When called before `__init` has resolved.
   */
  public getPressedKeys(): InputEnum[] {
    if (!this._inputHandler) this.throwNotInitializedError();
    const res: InputEnum[] = [];
    for (const rawKey in this._inputHandler.inputs) {
      const key = rawKey as InputEnum;
      if (this._inputHandler.getKeyStatus(key)) res.push(key);
    }
    return res;
  }

  /**
   * Return the current mouse cursor position.
   *
   * @returns Object with `x` and `y` in CSS pixels.
   * @throws `NfNotInitializedException` When called before `__init` has resolved.
   */
  public getMousePosition(): { x: number; y: number } {
    if (!this._inputHandler) this.throwNotInitializedError();
    return this._inputHandler.getMousePosition();
  }

  /**
   * Return the full mouse state snapshot for the current frame.
   *
   * @returns `MouseState` containing position, previous position, deltas, and focus.
   * @throws `NfNotInitializedException` When called before `__init` has resolved.
   */
  public getMouseState(): MouseState {
    if (!this._inputHandler) this.throwNotInitializedError();
    return this._inputHandler.mouse;
  }

  /**
   * Return whether a drag operation is in progress.
   *
   * @param button - If provided, only returns true when a drag was started
   *   with this specific button.
   * @returns `true` when a drag is active (optionally matching the given button).
   * @throws `NfNotInitializedException` When called before `__init` has resolved.
   */
  public isDragging(button?: InputEnum): boolean {
    if (!this._inputHandler) this.throwNotInitializedError();
    return this._inputHandler.isDragging(button);
  }

  /**
   * Return the current drag state.
   *
   * @returns `DragState` with start position, current position, and deltas.
   * @throws `NfNotInitializedException` When called before `__init` has resolved.
   */
  public getDragState(): DragState {
    if (!this._inputHandler) this.throwNotInitializedError();
    return this._inputHandler.drag;
  }

  /**
   * Return the scroll-wheel state accumulated during the current frame.
   *
   * @remarks
   * All deltas are reset to `0` at the start of the next frame.
   *
   * @returns `WheelState` with `deltaX`, `deltaY`, and `deltaZ`.
   * @throws `NfNotInitializedException` When called before `__init` has resolved.
   */
  public getWheelState(): WheelState {
    if (!this._inputHandler) this.throwNotInitializedError();
    return this._inputHandler.wheel;
  }
}
