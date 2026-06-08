import { type IExposedLibrary } from "../bases/exposed.library.type";
import { type IRunnerLibrary } from "../bases/runner.library.type";

/**
 * Interface for component-system (ECS) libraries.
 *
 * @remarks
 * Implemented by `BaseComponentSystemLibrary` and the higher-level
 * `AbstractECSLibrary`, with concrete subclasses
 * `ECSClientLibrary` and `ECSServerLibrary`.  Access an instance
 * via `ctx.libraries.getComponentSystem().library`.
 */
export interface IComponentSystemLibrary extends IExposedLibrary, IRunnerLibrary {}
