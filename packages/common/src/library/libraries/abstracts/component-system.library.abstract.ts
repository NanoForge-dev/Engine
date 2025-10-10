import { type Context } from "../../../context";
import { type IComponentSystemLibrary } from "../interfaces";
import { Library } from "../library";

export abstract class BaseComponentSystemLibrary
  extends Library
  implements IComponentSystemLibrary
{
  abstract __run(context: Context): Promise<void>;
}
