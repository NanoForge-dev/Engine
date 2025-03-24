import { type ApplicationContext, type ClearContext } from "../../context";
import { type IDependencies } from "../dependencies/dependencies.type";

export interface ILibrary {
  get name(): string;

  init(context: ApplicationContext): Promise<void>;

  clear(context: ClearContext): Promise<void>;
}

export interface ILibraryOptions {
  dependencies?: symbol[];
  detailedDependencies?: IDependencies;
}
