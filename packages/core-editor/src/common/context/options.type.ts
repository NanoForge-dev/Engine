import { type IEventEmitter } from "./event-emitter.type";
import { type Save } from "./save.type";

/**
 * Union of client and server editor run options accepted by
 * `NanoforgeApplication.init` in editor mode.
 */
export type IEditorRunOptions = IEditorRunClientOptions | IEditorRunServerOptions;

/**
 * Run options for a client-side editor application.
 *
 * @remarks
 * Extends the base run options with editor-specific communication channels.
 */
export interface IEditorRunClientOptions {
  /** DOM element that will host the game canvas. */
  container: HTMLDivElement;
  /** Map of virtual file paths to their resolved URL strings. */
  files: Map<string, string>;
  /** Runtime environment variables available to all libraries. */
  env: Record<string, string | undefined>;
  /** Editor integration hooks. */
  editor: {
    /** Serialised scene state loaded or saved by the editor. */
    save: Save;
    /** Event emitter for core-to-editor communication. */
    coreEvents: IEventEmitter;
    /** Event emitter for editor-to-core communication. */
    editorEvents: IEventEmitter;
  };
}

/**
 * Run options for a server-side editor application.
 *
 * @remarks
 * Extends the base server run options with editor-specific communication channels.
 */
export interface IEditorRunServerOptions {
  /** Map of virtual file paths to their resolved URL strings. */
  files: Map<string, string>;
  /** Runtime environment variables available to all libraries. */
  env: Record<string, string | undefined>;
  /** Editor integration hooks. */
  editor: {
    /** Serialised scene state loaded or saved by the editor. */
    save: Save;
    /** Event emitter for core-to-editor communication. */
    coreEvents: IEventEmitter;
    /** Event emitter for editor-to-core communication. */
    editorEvents: IEventEmitter;
  };
}
