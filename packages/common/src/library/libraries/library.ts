import { type ClearContext, type InitContext } from "../../context";
import { type ILibrary } from "./library.type";

export abstract class Library implements ILibrary {
  abstract get name(): string;

  abstract init(context: InitContext): Promise<void>;

  abstract clear(context: ClearContext): Promise<void>;
}
