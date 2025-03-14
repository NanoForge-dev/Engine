export enum LibraryStatusEnum {
  UNLOADED = "UNLOADED",
  LOADED = "LOADED",
  CLEAR = "CLEAR",
}

export class LibraryContext {
  protected _status: LibraryStatusEnum;

  get status() {
    return this._status;
  }
}
