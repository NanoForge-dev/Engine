import { type NfException } from "./nfException";

export class NfNotFound implements NfException {
  get code(): number {
    return 404;
  }

  message: string;
  name: string;
  stack?: string | undefined;
  cause?: unknown;

  constructor(item: string) {
    this.message = item + "not found.";
  }
}
