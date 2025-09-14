import { type INfException } from "./nfException";

export class NfNotFound implements INfException {
  get code(): number {
    return 404;
  }

  message: string;
  name: string;
  stack?: string | undefined;
  cause?: unknown;

  constructor(item: string) {
    this.message = `${item} not found.`;
  }
}
