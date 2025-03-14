import { type IExposedLibrary } from "../bases/exposed.library.type";

export interface IAssetManagerLibrary extends IExposedLibrary {
  getAsset(path: string): Promise<string>;

  getScript(path: string): Promise<string>;
}
