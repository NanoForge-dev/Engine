import { NfException } from "../abstracts/exception.abstract";

/**
 * Thrown when a library is used before its `__init` lifecycle hook has
 * resolved.
 *
 * @remarks
 * Raised automatically by `Library.throwNotInitializedError()`.
 */
export class NfNotInitializedException extends NfException {
  get code(): number {
    return 404;
  }

  /**
   * @param item - Key of the uninitialised library.
   * @param type - Optional category label (e.g. "Library").
   */
  constructor(item: string, type?: string) {
    super(`${type ? `${type} - ` : ""}${item} not initialized.`);
  }
}
