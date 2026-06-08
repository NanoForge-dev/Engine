import { NfException } from "../abstracts/exception.abstract";

/**
 * Thrown when an HTTP fetch performed internally by the engine fails.
 *
 * @remarks
 * Raised by `NfFile` methods (e.g. `arrayBuffer`, `text`) when the
 * underlying `fetch` call returns a non-OK HTTP response.
 */
export class NfFetchException extends NfException {
  private readonly _code: number;

  /**
   * The HTTP status code returned by the failed request (e.g. `404`, `500`).
   */
  get code(): number {
    return this._code;
  }

  /**
   * @param code - HTTP status code of the failed response.
   * @param text - Status text of the failed response.
   */
  constructor(code: number, text: string) {
    super(`Fetch exception : ${code} - ${text}`);
    this._code = code;
  }
}
