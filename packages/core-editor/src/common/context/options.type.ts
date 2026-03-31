import { type IEventEmitter } from "./event-emitter.type";
import { type Save } from "./save.type";

export type IEditorRunOptions = IEditorRunClientOptions | IEditorRunServerOptions;

export interface IEditorRunClientOptions {
  canvas: HTMLCanvasElement;
  files: Map<string, string>;
  env: Record<string, string | undefined>;
  editor: {
    save: Save;
    coreEvents: IEventEmitter;
    editorEvents: IEventEmitter;
  };
}
export interface IEditorRunServerOptions {
  files: Map<string, string>;
  env: Record<string, string | undefined>;
  editor: {
    save: Save;
    coreEvents: IEventEmitter;
    editorEvents: IEventEmitter;
  };
}
