import { type Save } from "./save.type";

export type IEditorRunOptions = IEditorRunClientOptions | IEditorRunServerOptions;

export interface IEditorRunClientOptions {
  canvas: HTMLCanvasElement;
  files: Map<string, string>;
  env: Record<string, string | undefined>;
  editor: {
    save: Save;
  };
}
export interface IEditorRunServerOptions {
  canvas: HTMLCanvasElement;
  files: Map<string, string>;
  env: Record<string, string | undefined>;
  editor: {
    save: Save;
  };
}
