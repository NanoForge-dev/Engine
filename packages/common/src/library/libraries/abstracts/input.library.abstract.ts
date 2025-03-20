import { type InitContext } from "../../../context";
import { type IInputLibrary } from "../interfaces";
import { Library } from "../library";

export abstract class BaseInputLibrary extends Library implements IInputLibrary {
  public abstract init(context: InitContext): Promise<void>;
}
