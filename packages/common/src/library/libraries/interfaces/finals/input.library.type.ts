import { type IExposedLibrary } from "../bases/exposed.library.type";
import { type IRunnerLibrary } from "../bases/runner.library.type";

/**
 * Interface for input libraries.
 *
 * @remarks
 * Implemented by `BaseInputLibrary` and its concrete subclass
 * `InputLibrary`.  Access an instance via
 * `ctx.libraries.getInput().library`.
 */
export interface IInputLibrary extends IExposedLibrary, IRunnerLibrary {}
