import { type Context } from "../../../context";
import { type IComponentSystemLibrary } from "../interfaces";
import { Library } from "../library";

/**
 * Abstract base class for component-system (ECS) libraries.
 *
 * @remarks
 * Extend this class (or the higher-level `AbstractECSLibrary`) to
 * implement a custom ECS back-end and register it with
 * `NanoforgeApplication.useComponentSystem`.  The built-in
 * implementations are `ECSClientLibrary` and `ECSServerLibrary`.
 */
export abstract class BaseComponentSystemLibrary
  extends Library
  implements IComponentSystemLibrary
{
  /** @internal */
  abstract __run(context: Context): Promise<void>;
}
