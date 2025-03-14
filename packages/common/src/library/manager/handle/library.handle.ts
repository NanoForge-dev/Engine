import { type LibraryContext } from "../../../context";
import { type ILibrary } from "../../libraries/library.type";

export class LibraryHandle<T extends ILibrary = ILibrary> {
  private readonly _symbol: symbol;
  private readonly _library: T;
  private readonly _context: LibraryContext;

  constructor(sym: symbol, library: T, defaultContext: LibraryContext) {
    this._symbol = sym;
    this._library = library;
    this._context = defaultContext;
  }

  get symbol(): symbol {
    return this._symbol;
  }

  get library(): T {
    return this._library;
  }

  get context(): LibraryContext {
    return this._context;
  }
}
