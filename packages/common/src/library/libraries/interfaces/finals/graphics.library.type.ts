import { type IExposedLibrary } from "../bases/exposed.library.type";
import { type IRunnerLibrary } from "../bases/runner.library.type";

/**
 * Interface for graphics libraries.
 *
 * @remarks
 * Implemented by `BaseGraphicsLibrary` and its concrete subclass
 * `Graphics2DLibrary`.  Access an instance via
 * `ctx.libraries.getGraphics().library`.
 */
export interface IGraphicsLibrary extends IExposedLibrary, IRunnerLibrary {}
