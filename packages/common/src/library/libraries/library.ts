import { type ClearContext, type InitContext } from "../../context";
import { DependenciesHandler } from "../dependencies/dependencies-handler";
import { type ILibrary, type ILibraryOptions } from "./library.type";

export abstract class Library implements ILibrary {
  protected _dependencies: DependenciesHandler;

  constructor(options?: ILibraryOptions) {
    this._dependencies = new DependenciesHandler(
      options?.detailedDependencies?.initDependencies ?? options?.dependencies,
      options?.detailedDependencies?.runtimeDependencies ?? options?.dependencies,
      options?.detailedDependencies?.clearDependencies ?? options?.dependencies,
      options?.detailedDependencies?.implementationDependencies,
    );
  }

  get dependencies(): DependenciesHandler {
    return this._dependencies;
  }

  abstract get name(): string;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async init(_context: InitContext): Promise<void> {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async clear(_context: ClearContext): Promise<void> {}
}
