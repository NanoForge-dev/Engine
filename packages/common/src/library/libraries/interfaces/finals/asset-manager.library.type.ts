import { type IExposedLibrary } from "../bases/exposed.library.type";

export interface IFile {
  get path(): string;

  getText(): Promise<string>;
}

export interface IAssetManagerLibrary extends IExposedLibrary {
  getAsset(path: string): Promise<IFile>;

  getWasm(path: string): Promise<IFile>;

  getWgsl(path: string): Promise<IFile>;
}
