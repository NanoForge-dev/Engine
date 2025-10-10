export class ApplicationContext {
  private _isRunning: boolean = false;

  get isRunning(): boolean {
    return this._isRunning;
  }

  setIsRunning(value: boolean): void {
    this._isRunning = value;
  }
}
