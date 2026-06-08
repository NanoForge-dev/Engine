import { NfException } from "../abstracts/exception.abstract";

/**
 * Thrown when a method is called on a library or engine component before it
 * has been initialised via `__init`.
 *
 * @remarks
 * This exception is raised automatically by the helper method
 * `Library.throwNotInitializedError()`.  Ensure that
 * `NanoforgeApplication.init` has resolved before interacting with any
 * library.
 */
export class NfNotInitializedException extends NfException {
  /** Always `404`. */
  get code(): number {
    return 404;
  }

  /**
   * @param item - Name of the uninitialised component (e.g. the library's __name).
   * @param type - Optional category label (e.g. "Library").
   */
  constructor(item: string, type?: string) {
    super(`${type ? `${type} - ` : ""}${item} not initialized.`);
  }
}
