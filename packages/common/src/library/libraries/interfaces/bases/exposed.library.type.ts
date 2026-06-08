import { type ILibrary } from "../../library.type";

/**
 * Marker interface for libraries that are directly accessible to game code via
 * the `ClientLibraryManager`.
 *
 * @remarks
 * All built-in typed library interfaces (e.g. `IAssetManagerLibrary`,
 * `ISoundLibrary`) extend this interface.
 */
export interface IExposedLibrary extends ILibrary {}
