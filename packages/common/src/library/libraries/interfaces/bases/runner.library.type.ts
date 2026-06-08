import { type Context } from "../../../../context";
import { type ILibrary } from "../../library.type";

/**
 * Interface for libraries that participate in the per-frame game loop.
 *
 * @remarks
 * The engine calls `__run` on every tick for all registered runner libraries
 * in the order determined by their `ILibraryOptions.runBefore` /
 * `ILibraryOptions.runAfter` relationships.
 */
export interface IRunnerLibrary extends ILibrary {
  /** @internal */
  __run(context: Context): Promise<void>;
}
