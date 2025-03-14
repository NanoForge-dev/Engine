import type { ExecutionContext } from "../../../context";
import { type IGraphicsLibrary } from "../interfaces";
import { Library } from "../library";

export abstract class BaseGraphicsLibrary extends Library implements IGraphicsLibrary {
  abstract run(context: ExecutionContext): Promise<void>;
}
