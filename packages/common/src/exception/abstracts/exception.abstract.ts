/**
 * Base class for all NanoForge engine exceptions.
 *
 * @remarks
 * All errors thrown by the engine extend this class so that game code can
 * differentiate engine errors from unrelated runtime errors.
 */
export abstract class NfException extends Error {
  /**
   * HTTP-style numeric code identifying the error category.
   */
  abstract get code(): number;

  protected constructor(message?: string) {
    super(
      message ? `[NANOFORGE] ${message}` : "[NANOFORGE] An error occurred (Unknown exception).",
    );
  }
}
