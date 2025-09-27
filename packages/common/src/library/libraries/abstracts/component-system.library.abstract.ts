import { type ExecutionContext } from "../../../context";
import { type IComponentSystemLibrary } from "../interfaces";
import { Library } from "../library";

export abstract class BaseComponentSystemLibrary
  extends Library
  implements IComponentSystemLibrary
{
  abstract run(context: ExecutionContext<this>): Promise<void>;
}
