import { type ClearContext, type InitContext } from "../../context";
import { type RelationshipHandler } from "../relationship/relationship-handler";

export interface ILibrary {
  get __name(): string;

  get __relationship(): RelationshipHandler;

  __init(context: InitContext): Promise<void>;

  __clear(context: ClearContext): Promise<void>;
}

export interface ILibraryOptions {
  dependencies: symbol[];
  runBefore: symbol[];
  runAfter: symbol[];
}
