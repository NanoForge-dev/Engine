import { type ApplicationContext, type ClearContext } from "../../context";
import { type RelationshipHandler } from "../relationship/relationship-handler";

export interface ILibrary {
  get name(): string;

  get relationship(): RelationshipHandler;

  init(context: ApplicationContext): Promise<void>;

  clear(context: ClearContext): Promise<void>;
}

export interface ILibraryOptions {
  dependencies: symbol[];
  runBefore: symbol[];
  runAfter: symbol[];
}
