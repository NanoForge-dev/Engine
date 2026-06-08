import { type IExposedLibrary } from "../bases/exposed.library.type";
import { type IMutableLibrary } from "../bases/mutable.library.type";

/**
 * Interface for music libraries.
 *
 * @remarks
 * Implemented by `BaseMusicLibrary` and its concrete subclass
 * `MusicLibrary`.  Access an instance via
 * `ctx.libraries.getMusic().library`.
 */
export interface IMusicLibrary extends IExposedLibrary, IMutableLibrary {}
