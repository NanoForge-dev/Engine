import { nextButtonState } from "../shared";
import { ControllerAxis, type ControllerStick } from "./controller.enum";
import type {
  ControllerButtonState,
  ControllerListener,
  ControllerState,
  StickPosition,
} from "./controller.types";

const STICK_AXES: Record<ControllerStick, [ControllerAxis, ControllerAxis]> = {
  left: [ControllerAxis.LeftStickX, ControllerAxis.LeftStickY],
  right: [ControllerAxis.RightStickX, ControllerAxis.RightStickY],
};

/**
 * Tracks connected controllers through the Gamepad API.
 *
 * @remarks
 * The Gamepad API does not emit events for buttons or axes: state is read by
 * `poll`, once per frame. Connection events are only used to report
 * connections/disconnections as early as possible; `poll` also detects them,
 * since some browsers only expose a controller after its first input.
 */
export class ControllerHandler {
  private readonly deadzone: number;
  private readonly controllers = new Map<number, ControllerState>();
  private readonly connectListeners = new Set<ControllerListener>();
  private readonly disconnectListeners = new Set<ControllerListener>();

  constructor(deadzone: number) {
    this.deadzone = deadzone;

    window.addEventListener("gamepadconnected", this.onConnected);
    window.addEventListener("gamepaddisconnected", this.onDisconnected);
  }

  /** Removes every listener registered by the constructor. */
  public destroy(): void {
    window.removeEventListener("gamepadconnected", this.onConnected);
    window.removeEventListener("gamepaddisconnected", this.onDisconnected);
    this.controllers.clear();
    this.connectListeners.clear();
    this.disconnectListeners.clear();
  }

  /** Reads every gamepad and updates button transitions for this frame. */
  public poll(): void {
    const seen = new Set<number>();
    for (const gamepad of navigator.getGamepads()) {
      if (!gamepad?.connected) continue;
      seen.add(gamepad.index);
      this.update(gamepad);
    }
    for (const index of [...this.controllers.keys()]) {
      if (!seen.has(index)) this.disconnect(index);
    }
  }

  public getControllers(): ControllerState[] {
    return [...this.controllers.values()];
  }

  public getController(index: number): ControllerState | undefined {
    return this.controllers.get(index);
  }

  public getButton(button: number, index: number): ControllerButtonState | undefined {
    return this.controllers.get(index)?.buttons[button];
  }

  /** Axis value with the deadzone applied and rescaled to keep the full range. */
  public getAxis(axis: number, index: number): number {
    const value = this.controllers.get(index)?.axes[axis] ?? 0;
    const magnitude = Math.abs(value);
    if (magnitude < this.deadzone) return 0;
    return (Math.sign(value) * (magnitude - this.deadzone)) / (1 - this.deadzone);
  }

  /** Stick position with a radial deadzone, so diagonals are not clipped. */
  public getStick(stick: ControllerStick, index: number): StickPosition {
    const controller = this.controllers.get(index);
    const [axisX, axisY] = STICK_AXES[stick];
    const x = controller?.axes[axisX] ?? 0;
    const y = controller?.axes[axisY] ?? 0;
    const magnitude = Math.hypot(x, y);
    if (magnitude < this.deadzone) return { x: 0, y: 0 };
    const scale = Math.min(1, (magnitude - this.deadzone) / (1 - this.deadzone)) / magnitude;
    return { x: x * scale, y: y * scale };
  }

  public async vibrate(
    index: number,
    duration: number,
    strongMagnitude: number,
    weakMagnitude: number,
  ): Promise<boolean> {
    const gamepad = navigator.getGamepads()[index];
    const actuator = gamepad?.vibrationActuator as GamepadHapticActuator | null | undefined;
    if (!actuator) return false;
    const result = await actuator.playEffect("dual-rumble", {
      duration,
      strongMagnitude,
      weakMagnitude,
    });
    return result === "complete";
  }

  public onConnect(listener: ControllerListener): () => void {
    this.connectListeners.add(listener);
    return () => this.connectListeners.delete(listener);
  }

  public onDisconnect(listener: ControllerListener): () => void {
    this.disconnectListeners.add(listener);
    return () => this.disconnectListeners.delete(listener);
  }

  private readonly onConnected = (e: GamepadEvent): void => {
    this.update(e.gamepad);
  };

  private readonly onDisconnected = (e: GamepadEvent): void => {
    this.disconnect(e.gamepad.index);
  };

  private update(gamepad: Gamepad): void {
    const previous = this.controllers.get(gamepad.index);
    const state: ControllerState = {
      index: gamepad.index,
      id: gamepad.id,
      mapping: gamepad.mapping,
      buttons: gamepad.buttons.map((button, i) => ({
        ...nextButtonState(button.pressed, previous?.buttons[i]?.pressed),
        value: button.value,
      })),
      axes: [...gamepad.axes],
    };
    this.controllers.set(gamepad.index, state);
    if (!previous) this.connectListeners.forEach((listener) => listener(state));
  }

  private disconnect(index: number): void {
    const state = this.controllers.get(index);
    if (!state) return;
    this.controllers.delete(index);
    this.disconnectListeners.forEach((listener) => listener(state));
  }
}
