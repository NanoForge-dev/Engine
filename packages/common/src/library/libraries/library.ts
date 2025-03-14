import { type ClearContext, type InitContext } from "../../context";
import { type ILibrary } from "./library.type";

export abstract class Library implements ILibrary {
  abstract get name(): string;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public init(_context: InitContext): Promise<void> {
    return Promise.resolve();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public clear(_context: ClearContext): Promise<void> {
    return Promise.resolve();
  }
}
