import { NfException } from "../abstracts/exception.abstract";

export class NfConfigException extends NfException {
  get code(): number {
    return 400;
  }

  constructor(message: string, library?: string) {
    super(`Config Exception ${library ? `(${library}) ` : ""}- ${message}`);
  }
}
