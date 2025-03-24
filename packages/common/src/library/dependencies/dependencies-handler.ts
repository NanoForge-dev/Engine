import type { ClassType } from "../../common/class.type";
import type { ILibrary } from "../libraries";

export class DependenciesHandler {
  private readonly _initDependencies: symbol[];
  private readonly _runtimeDependencies: symbol[];
  private readonly _clearDependencies: symbol[];
  private readonly _implementationDependencies: ClassType<ILibrary>[];

  constructor(
    initDependencies: symbol[] = [],
    runtimeDependencies: symbol[] = [],
    clearDependencies: symbol[] = [],
    implementationDependencies: ClassType<ILibrary>[] = [],
  ) {
    this._initDependencies = initDependencies;
    this._runtimeDependencies = runtimeDependencies;
    this._clearDependencies = clearDependencies;
    this._implementationDependencies = implementationDependencies;
  }

  get initDependencies(): symbol[] {
    return this._initDependencies;
  }

  get runtimeDependencies(): symbol[] {
    return this._runtimeDependencies;
  }

  get clearDependencies(): symbol[] {
    return this._clearDependencies;
  }

  get implementationDependencies(): ClassType<ILibrary>[] {
    return this._implementationDependencies;
  }
}
