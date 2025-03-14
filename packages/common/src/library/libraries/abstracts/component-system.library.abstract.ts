import { type IComponentSystemLibrary } from "../interfaces";
import { Library } from "../library";

export abstract class BaseComponentSystemLibrary
  extends Library
  implements IComponentSystemLibrary {}
