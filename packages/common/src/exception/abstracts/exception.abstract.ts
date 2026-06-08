import type { INfException } from "../interfaces/exception.type";

/**
 * Base class for all NanoForge engine exceptions.
 *
 * @remarks
 * All errors thrown by the engine extend this class so that game code can
 * differentiate engine errors from unrelated runtime errors.
 *
 * @example
 * ```ts
 * try {
 *   assetManager.getAsset("/missing.png");
 * } catch (err) {
 *   if (err instanceof NfException) {
 *     console.error(err.code, err.message);
 *   }
 * }
 * ```
 */
export abstract class NfException extends Error implements INfException {
  /**
   * HTTP-style numeric code identifying the error category.
   */
  abstract get code(): number;

  /**
   * @param message - Optional human-readable description of the error.
   */
  protected constructor(message?: string) {
    super(
      message ? `[NANOFORGE] ${message}` : "[NANOFORGE] An error occurred (Unknown exception).",
    );
  }
}
