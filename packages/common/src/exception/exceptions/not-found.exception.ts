import {type INfException} from "../interfaces/exception.type";
import {NfException} from "../abstracts/exception.abstract";

export class NfNotFound extends NfException {
  get code(): number {
    return 404;
  }

  constructor(item: string, type?: string) {
    super(`${type ? `${type} - ` : ""}${item} not found.`);
  }
}
