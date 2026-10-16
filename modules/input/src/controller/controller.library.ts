import { Library, defineLibraryKey } from "@nanoforge-dev/common";

import { clientOnlyError } from "../shared";
import type { ControllerContextApi } from "./controller-context.type";
import { ControllerHandler } from "./controller-handler";
import type { ControllerAxis, ControllerButton, ControllerStick } from "./controller.enum";
import type {
  ControllerLibraryOptions,
  ControllerListener,
  ControllerState,
  ControllerVibration,
  StickPosition,
} from "./controller.types";

const DEFAULT_DEADZONE = 0.15;

/**
 * Built-in controller library, based on the Gamepad API.
 *
 * @remarks
 * Polls `navigator.getGamepads()` once per frame and exposes a snapshot of
 * every connected controller on `Context.controller`. Buttons and axes follow
 * the W3C "standard" layout (`ControllerButton`, `ControllerAxis`); every
 * method takes an optional controller index, `0` by default. Client-only —
 * `__init` throws if the Gamepad API is unavailable. Browsers only expose a
 * controller after the user pressed one of its buttons.
 *
 * @example
 * ```ts
 * app.use(new ControllerLibrary({ deadzone: 0.2 }));
 *
 * // in a system
 * const { x, y } = ctx.controller.getStick("left");
 * if (ctx.controller.isButtonJustPressed(ControllerButton.A)) player.jump();
 * ```
 */
export class ControllerLibrary extends Library {
  readonly key = defineLibraryKey("controller");

  private readonly _deadzone: number;
  private _handler?: ControllerHandler;

  constructor(options: ControllerLibraryOptions = {}) {
    super();
    const deadzone = options.deadzone ?? DEFAULT_DEADZONE;
    if (deadzone < 0 || deadzone >= 1) {
      throw new RangeError("ControllerLibrary deadzone must be in [0, 1).");
    }
    this._deadzone = deadzone;
  }

  public override async __init(): Promise<void> {
    if (typeof navigator === "undefined" || typeof navigator.getGamepads !== "function") {
      throw clientOnlyError("ControllerLibrary", "the Gamepad API is unavailable");
    }
    this._handler = new ControllerHandler(this._deadzone);
  }

  public override async __run(): Promise<void> {
    if (!this._handler) this.throwNotInitializedError();
    this._handler.poll();
  }

  public override async __clear(): Promise<void> {
    this._handler?.destroy();
  }

  public getControllers(): ControllerState[] {
    if (!this._handler) this.throwNotInitializedError();
    return this._handler.getControllers();
  }

  public getController(index = 0): ControllerState | undefined {
    if (!this._handler) this.throwNotInitializedError();
    return this._handler.getController(index);
  }

  public isConnected(index = 0): boolean {
    return this.getController(index) !== undefined;
  }

  public isButtonPressed(button: ControllerButton, index = 0): boolean {
    if (!this._handler) this.throwNotInitializedError();
    return this._handler.getButton(button, index)?.pressed ?? false;
  }

  public isButtonJustPressed(button: ControllerButton, index = 0): boolean {
    if (!this._handler) this.throwNotInitializedError();
    return this._handler.getButton(button, index)?.justPressed ?? false;
  }

  public isButtonJustReleased(button: ControllerButton, index = 0): boolean {
    if (!this._handler) this.throwNotInitializedError();
    return this._handler.getButton(button, index)?.justReleased ?? false;
  }

  /** @returns The analog value of the button, between `0` and `1`. */
  public getButtonValue(button: ControllerButton, index = 0): number {
    if (!this._handler) this.throwNotInitializedError();
    return this._handler.getButton(button, index)?.value ?? 0;
  }

  /** @returns The axis value between `-1` and `1`, with the deadzone applied. */
  public getAxis(axis: ControllerAxis, index = 0): number {
    if (!this._handler) this.throwNotInitializedError();
    return this._handler.getAxis(axis, index);
  }

  /** @returns The stick position, with a radial deadzone applied. */
  public getStick(stick: ControllerStick, index = 0): StickPosition {
    if (!this._handler) this.throwNotInitializedError();
    return this._handler.getStick(stick, index);
  }

  /**
   * Plays a rumble effect.
   *
   * @returns `true` if the effect played to completion, `false` if the
   * controller has no vibration support or the effect was interrupted.
   */
  public vibrate(effect: ControllerVibration, index = 0): Promise<boolean> {
    if (!this._handler) this.throwNotInitializedError();
    return this._handler.vibrate(
      index,
      effect.duration,
      effect.strongMagnitude ?? 1,
      effect.weakMagnitude ?? 1,
    );
  }

  /** @returns A function that removes the listener. */
  public onConnect(listener: ControllerListener): () => void {
    if (!this._handler) this.throwNotInitializedError();
    return this._handler.onConnect(listener);
  }

  /** @returns A function that removes the listener. */
  public onDisconnect(listener: ControllerListener): () => void {
    if (!this._handler) this.throwNotInitializedError();
    return this._handler.onDisconnect(listener);
  }

  public override expose(): ControllerContextApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const library = this;
    return {
      getControllers: () => library.getControllers(),
      getController: (index) => library.getController(index),
      isConnected: (index) => library.isConnected(index),
      isButtonPressed: (button, index) => library.isButtonPressed(button, index),
      isButtonJustPressed: (button, index) => library.isButtonJustPressed(button, index),
      isButtonJustReleased: (button, index) => library.isButtonJustReleased(button, index),
      getButtonValue: (button, index) => library.getButtonValue(button, index),
      getAxis: (axis, index) => library.getAxis(axis, index),
      getStick: (stick, index) => library.getStick(stick, index),
      vibrate: (effect, index) => library.vibrate(effect, index),
      onConnect: (listener) => library.onConnect(listener),
      onDisconnect: (listener) => library.onDisconnect(listener),
    };
  }
}
