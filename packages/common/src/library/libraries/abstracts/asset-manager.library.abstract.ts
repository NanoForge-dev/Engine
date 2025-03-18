import { type InitContext } from "../../../context";
import { type IAssetManagerLibrary, type IFile } from "../interfaces";
import { Library } from "../library";

export abstract class BaseAssetManagerLibrary extends Library implements IAssetManagerLibrary {
  public abstract init(context: InitContext): Promise<void>;

  public abstract getAsset(path: string): Promise<IFile>;

  public abstract getWasm(path: string): Promise<IFile>;

  public abstract getWgsl(path: string): Promise<IFile>;
}
