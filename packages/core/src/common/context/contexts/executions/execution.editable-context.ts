import { ExecutionContext } from "@nanoforge/common";

export class EditableExecutionContext extends ExecutionContext {
  setIsRunning(isRunning: boolean) {
    this._isRunning = isRunning;
  }
}
