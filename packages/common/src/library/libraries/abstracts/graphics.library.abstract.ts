import { type Context } from "../../../context";
import { type IGraphicsLibrary } from "../interfaces";
import { Library } from "../library";

export abstract class BaseGraphicsLibrary extends Library implements IGraphicsLibrary {
  abstract __run(context: Context): Promise<void>;
}
