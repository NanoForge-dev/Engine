import type { ControllerAxis, ControllerButton, ControllerStick } from "./controller.enum";
import type {
  ControllerListener,
  ControllerState,
  ControllerVibration,
  StickPosition,
} from "./controller.types";

/** Public surface of `ControllerLibrary`, exposed on `Context.controller`. */
export interface ControllerContextApi {
  getControllers(): ControllerState[];
  getController(index?: number): ControllerState | undefined;
  isConnected(index?: number): boolean;
  isButtonPressed(button: ControllerButton, index?: number): boolean;
  isButtonJustPressed(button: ControllerButton, index?: number): boolean;
  isButtonJustReleased(button: ControllerButton, index?: number): boolean;
  getButtonValue(button: ControllerButton, index?: number): number;
  getAxis(axis: ControllerAxis, index?: number): number;
  getStick(stick: ControllerStick, index?: number): StickPosition;
  vibrate(effect: ControllerVibration, index?: number): Promise<boolean>;
  onConnect(listener: ControllerListener): () => void;
  onDisconnect(listener: ControllerListener): () => void;
}
