import type { EventEmitter } from "./common/context/event-emitter";
import type { IEventEmitter } from "./common/context/event-emitter.type";
import type { CoreEvents, CoreEventsMap } from "./common/context/events/core-events";
import type { EditorEvents, EditorEventsMap } from "./common/context/events/editor-events";
import type { Save } from "./common/context/save.type";

declare module "@nanoforge-dev/common" {
  interface IRunClientOptions {
    /** Editor integration hooks. */
    editor: {
      /** Serialised scene state loaded or saved by the editor. */
      save: Save;
      /** Event emitter for core-to-editor communication. */
      coreEvents: IEventEmitter<CoreEvents, CoreEventsMap>;
      /** Event emitter for editor-to-core communication. */
      editorEvents: IEventEmitter<EditorEvents, EditorEventsMap>;
    };
  }

  interface IRunServerOptions {
    /** Editor integration hooks. */
    editor: {
      /** Serialised scene state loaded or saved by the editor. */
      save: Save;
      /** Event emitter for core-to-editor communication. */
      coreEvents: IEventEmitter<CoreEvents, CoreEventsMap>;
      /** Event emitter for editor-to-core communication. */
      editorEvents: IEventEmitter<EditorEvents, EditorEventsMap>;
    };
  }

  interface InitContext {
    editor: {
      eventEmitter: EventEmitter;
    };
  }
}

export * from "./application/nanoforge-factory";

export type { NanoforgeClient } from "./application/nanoforge-client";
export type { NanoforgeServer } from "./application/nanoforge-server";
export { type EventEmitter, CoreEvents, EditorEvents } from "./common/context";
