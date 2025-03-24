import { type ClassType } from "../../common/class.type";
import { type ILibrary } from "../libraries";

export interface IDependencies {
  initDependencies: symbol[];
  runtimeDependencies: symbol[];
  clearDependencies: symbol[];

  implementationDependencies: ClassType<ILibrary>[];
}
