import { type IExposedLibrary } from "../bases/exposed.library.type";
import { type IMutableLibrary } from "../bases/mutable.library.type";

/**
 * Interface for sound-effect libraries.
 *
 * @remarks
 * Implemented by `BaseSoundLibrary` and its concrete subclass
 * `SoundLibrary`.  Access an instance via
 * `ctx.libraries.getSound().library`.
 */
export interface ISoundLibrary extends IExposedLibrary, IMutableLibrary {}
