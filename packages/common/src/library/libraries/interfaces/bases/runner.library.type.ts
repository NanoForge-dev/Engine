import { type ExecutionContext } from "../../../../context";
import { type ILibrary } from "../../library.type";

export interface IRunnerLibrary extends ILibrary {
  run(context: ExecutionContext): Promise<void>;
}
