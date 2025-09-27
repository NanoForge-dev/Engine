import { type IRunnerLibrary } from "../../../library";
import { BaseContext } from "./base.context";

export class ExecutionContext<T extends IRunnerLibrary> extends BaseContext {
  protected _isRunning: boolean = true;
  protected _currentLibrary: T;

  get isRunning() {
    return this._isRunning;
  }

  get lib(): T {
    return this._currentLibrary;
  }
}
