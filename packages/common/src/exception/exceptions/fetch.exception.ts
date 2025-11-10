import { NfException } from "../abstracts/exception.abstract";

export class NfFetchException extends NfException {
  private readonly _code: number;

  get code(): number {
    return this._code;
  }

  constructor(code: number, text: string) {
    super(`Fetch exception : ${code} - ${text}`);
    this._code = code;
  }
}
