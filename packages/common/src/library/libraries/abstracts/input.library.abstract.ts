import { type Context } from "../../../context";
import { type IInputLibrary } from "../interfaces";
import { Library } from "../library";

/**
 * Abstract base class for input libraries.
 *
 * @remarks
 * Extend this class to implement a custom input back-end and register it with
 * `NanoforgeClient.useInput`.  The built-in implementation is
 * `InputLibrary`.
 */
export abstract class BaseInputLibrary extends Library implements IInputLibrary {
  /** @internal */
  public abstract __run(_context: Context): Promise<void>;
}
