import { type LibraryContext } from "../../../context";
import { type ILibrary } from "../../libraries";

/**
 * An opaque handle returned by `LibraryManager` accessors.
 *
 * @remarks
 * Bundles the library instance together with its registration symbol and
 * lifecycle context.  Prefer using the strongly-typed accessor methods on
 * `LibraryManager` or `ClientLibraryManager` rather than
 * constructing handles directly.
 *
 * @typeParam T - Concrete library type (defaults to `ILibrary`).
 */
export class LibraryHandle<T extends ILibrary = ILibrary> {
  private readonly _symbol: symbol;
  private readonly _library: T;
  private readonly _context: LibraryContext;

  /**
   * @param sym - Registration symbol for this library.
   * @param library - The library instance.
   * @param defaultContext - Initial lifecycle context.
   */
  constructor(sym: symbol, library: T, defaultContext: LibraryContext) {
    this._symbol = sym;
    this._library = library;
    this._context = defaultContext;
  }

  /**
   * The registration symbol used to look up this library.
   */
  get symbol(): symbol {
    return this._symbol;
  }

  /**
   * The underlying library instance.
   */
  get library(): T {
    return this._library;
  }

  /**
   * Current lifecycle context tracking the library's status.
   */
  get context(): LibraryContext {
    return this._context;
  }
}
