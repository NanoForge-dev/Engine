import { ExecutionContext, type IRunnerLibrary } from "@nanoforge/common";

export class EditableExecutionContext<T extends IRunnerLibrary> extends ExecutionContext<T> {
  setIsRunning(isRunning: boolean) {
    this._isRunning = isRunning;
  }

  setCurrentLibrary(library: T) {
    this._currentLibrary = library;
  }
}
