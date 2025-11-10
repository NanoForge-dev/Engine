import { NfException } from "../abstracts/exception.abstract";

export class NfNotInitializedException extends NfException {
  get code(): number {
    return 404;
  }

  constructor(item: string, type?: string) {
    super(`${type ? `${type} - ` : ""}${item} not initialized.`);
  }
}
