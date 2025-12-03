import { type NfFile } from "../../../common";
import { type InitContext } from "../../../context";
import { type IAssetManagerLibrary } from "../interfaces";
import { Library } from "../library";

export abstract class BaseAssetManagerLibrary extends Library implements IAssetManagerLibrary {
  public abstract override __init(context: InitContext): Promise<void>;

  public abstract getAsset(path: string): NfFile;
}
