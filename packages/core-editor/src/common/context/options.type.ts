import { type EventEmitter } from "../../editor/event-emitter.manager";
import { type Save } from "./save.type";

export type IEditorRunOptions = IEditorRunClientOptions | IEditorRunServerOptions;

export interface IEditorRunClientOptions {
  canvas: HTMLCanvasElement;
  files: Map<string, string>;
  env: Record<string, string | undefined>;
  editor: {
    save: Save;
    coreEvents: EventEmitter;
    editorEvents: EventEmitter;
  };
}
export interface IEditorRunServerOptions {
  files: Map<string, string>;
  env: Record<string, string | undefined>;
  editor: {
    save: Save;
    coreEvents: EventEmitter;
    editorEvents: EventEmitter;
  };
}
