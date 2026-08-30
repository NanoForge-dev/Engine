import { NfException } from "../abstracts/exception.abstract";

/**
 * Thrown when two libraries are registered under the same context key, or
 * when a library tries to register under a reserved key (`"app"`, `"vars"`,
 * `"assets"`).
 */
export class NfDuplicateLibraryException extends NfException {
  get code(): number {
    return 409;
  }

  /**
   * @param key - The context key that was already taken or is reserved.
   */
  constructor(key: string) {
    super(`Library key "${key}" is already registered or reserved.`);
  }
}
