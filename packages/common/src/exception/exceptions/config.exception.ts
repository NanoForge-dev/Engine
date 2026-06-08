import { NfException } from "../abstracts/exception.abstract";

/**
 * Thrown when a library configuration is invalid or incomplete.
 *
 * @remarks
 * Typically raised during `__init` when required environment variables are
 * missing or fail validation.  For example, `NetworkClientLibrary` throws this
 * when neither `SERVER_TCP_PORT` nor `SERVER_UDP_PORT` is provided.
 */
export class NfConfigException extends NfException {
  /** Always `400`. */
  get code(): number {
    return 400;
  }

  /**
   * @param message - Description of the configuration error.
   * @param library - Optional library name that detected the error.
   */
  constructor(message: string, library?: string) {
    super(`Config Exception ${library ? `(${library}) ` : ""}- ${message}`);
  }
}
