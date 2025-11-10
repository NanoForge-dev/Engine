import { type NfFile } from "../../../../common";
import { type IExposedLibrary } from "../bases/exposed.library.type";

export interface IAssetManagerLibrary extends IExposedLibrary {
  getAsset(path: string): NfFile;
}
