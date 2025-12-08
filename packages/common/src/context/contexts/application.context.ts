export abstract class ApplicationContext {
  private _isRunning: boolean = false;
  protected _delta!: number;

  get isRunning(): boolean {
    return this._isRunning;
  }

  get delta(): number {
    return this._delta;
  }

  setIsRunning(value: boolean): void {
    this._isRunning = value;
  }

  abstract muteSoundLibraries(): void;
}
