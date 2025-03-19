import { BaseContext } from "./base.context";

export class ExecutionContext extends BaseContext {
  protected _isRunning: boolean = true;

  get isRunning() {
    return this._isRunning;
  }
}
