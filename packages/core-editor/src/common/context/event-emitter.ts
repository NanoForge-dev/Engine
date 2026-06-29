import type { IRunOptions } from "@nanoforge-dev/common";

import type { IEventEmitter, ListenerType } from "./event-emitter.type";
import type { CoreEvents, CoreEventsMap } from "./events/core-events";
import type { EditorEvents, EditorEventsMap } from "./events/editor-events";

export class EventEmitter {
  private coreEvents: IEventEmitter<CoreEvents, CoreEventsMap>;
  private editorEvents: IEventEmitter<EditorEvents, EditorEventsMap>;

  constructor(opts: IRunOptions["editor"]) {
    this.coreEvents = opts.coreEvents;
    this.editorEvents = opts.editorEvents;
  }

  runEvents(): void {
    this.coreEvents.runEvents();
  }

  emit<K extends keyof EditorEventsMap>(event: K, ...args: EditorEventsMap[K]): void {
    this.editorEvents.emitEvent(event, ...args);
  }

  on<K extends keyof CoreEventsMap>(
    event: K,
    listener: ListenerType<CoreEvents, CoreEventsMap, K>,
  ): void {
    this.coreEvents.on(event, listener);
  }
}
