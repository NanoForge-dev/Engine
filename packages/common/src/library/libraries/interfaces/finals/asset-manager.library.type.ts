import { type IExposedLibrary } from "../bases/exposed.library.type";

export interface IAssetManagerLibrary extends IExposedLibrary {
  getAsset(path: string): Promise<string>;

  getWasm(path: string): Promise<string>;

  getWgsl(path: string): Promise<string>;
}
