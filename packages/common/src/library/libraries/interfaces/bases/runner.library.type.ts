import { type Context } from "../../../../context";
import { type ILibrary } from "../../library.type";

export interface IRunnerLibrary extends ILibrary {
  __run(context: Context): Promise<void>;
}
