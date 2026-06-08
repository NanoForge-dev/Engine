/**
 * Lifecycle states a library can be in.
 */
export enum LibraryStatusEnum {
  /** The library has not been initialised yet. */
  UNLOADED = "UNLOADED",
  /** The library has been successfully initialised and is ready to use. */
  LOADED = "LOADED",
  /** The library has been cleared and its resources released. */
  CLEAR = "CLEAR",
}

/**
 * Tracks the current lifecycle state of a single library registration.
 */
export class LibraryContext {
  /** @internal */
  protected _status: LibraryStatusEnum = LibraryStatusEnum.UNLOADED;

  /**
   * Current lifecycle state of the associated library.
   */
  get status() {
    return this._status;
  }
}
