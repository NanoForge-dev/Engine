import { type LibraryContext } from "../../../context";
import { type ILibrary } from "../../libraries/library.type";
import { LibraryHandle } from "../handle/library.handle";

export class BaseLibraryManager {
  protected _libraries: LibraryHandle[] = [];
  private _librariesIndex: {
    [sym: symbol]: number;
  };

  /**
   * @todo Add error management
   */
  public get(sym: symbol): LibraryHandle {
    const index = this._librariesIndex[sym];
    if (!index) throw new Error(`Library not found: ${Symbol.keyFor(sym)}`);
    return this._get(index, sym);
  }

  protected setNewLibrary(sym: symbol, library: ILibrary, context: LibraryContext): void {
    const index = this._libraries.length;
    this._setIndex(sym, index);
    this._set(index, sym, library, context);
  }

  protected _get<T extends ILibrary = ILibrary>(index: number, sym?: symbol): LibraryHandle<T> {
    const result = this._libraries[index];
    if (!result) throw new Error(`Library not found: ${sym ? Symbol.keyFor(sym) : index}`);
    return result as LibraryHandle<T>;
  }

  protected _set(index: number, sym: symbol, library: ILibrary, context: LibraryContext): void {
    this._libraries[index] = new LibraryHandle(sym, library, context);
  }

  protected _setIndex(sym: symbol, index: number): void {
    this._librariesIndex[sym] = index;
  }
}
