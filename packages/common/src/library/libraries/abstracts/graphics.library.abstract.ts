import { type Context } from "../../../context";
import { type IGraphicsLibrary } from "../interfaces";
import { Library } from "../library";

/**
 * Abstract base class for graphics libraries.
 *
 * @remarks
 * Extend this class to implement a custom rendering backend and register it
 * with `NanoforgeClient.useGraphics`.  The built-in implementation is
 * `Graphics2DLibrary`.
 */
export abstract class BaseGraphicsLibrary extends Library implements IGraphicsLibrary {
  /** @internal */
  abstract __run(context: Context): Promise<void>;
}
