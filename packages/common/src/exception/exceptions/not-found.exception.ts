import { NfException } from "../abstracts/exception.abstract";

/**
 * Thrown when a requested resource (asset, library-contributed context key,
 * etc.) cannot be found.
 */
export class NfNotFound extends NfException {
  get code(): number {
    return 404;
  }

  /**
   * @param item - Name or path of the missing resource.
   * @param type - Optional category label (e.g. "Asset").
   */
  constructor(item: string, type?: string) {
    super(`${type ? `${type} - ` : ""}${item} not found.`);
  }
}
