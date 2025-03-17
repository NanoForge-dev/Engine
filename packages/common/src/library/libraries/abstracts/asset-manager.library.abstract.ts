import { type InitContext } from "../../../context";
import type { IAssetManagerLibrary } from "../interfaces";
import { Library } from "../library";

export abstract class BaseAssetManagerLibrary extends Library implements IAssetManagerLibrary {
  public abstract init(context: InitContext): Promise<void>;

  public abstract getAsset(path: string): Promise<string>;

  public abstract getScript(path: string): Promise<string>;
}
