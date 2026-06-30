import {
  type IEventEmitter,
  type ListenerType,
  type QueuedEvent,
} from "../../src/common/context/event-emitter.type";

export class EventEmitter<
  Events extends string,
  EventsMap extends Record<Events, unknown[]>,
> implements IEventEmitter<Events, EventsMap> {
  public listeners: {
    [K in keyof EventsMap]?: ListenerType<Events, EventsMap, K>[];
  } = {};

  public eventQueue: QueuedEvent<EventsMap>[] = [];
  private readonly _dequeueOnEmit: boolean;

  constructor(dequeueOnEmit = false) {
    this._dequeueOnEmit = dequeueOnEmit;
  }

  runEvents(): void {
    this.eventQueue.forEach((e) => {
      this._executeEvent(e);
    });

    this.eventQueue = [];
  }

  emitEvent<K extends keyof EventsMap>(event: K, ...args: EventsMap[K]): void {
    this.eventQueue.push({
      event,
      args,
    });
    if (this._dequeueOnEmit) this.runEvents();
  }
  addListener<K extends keyof EventsMap>(
    event: K,
    listener: ListenerType<Events, EventsMap, K>,
  ): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(listener);
  }
  on<K extends keyof EventsMap>(event: K, listener: ListenerType<Events, EventsMap, K>): void {
    this.addListener(event, listener);
  }

  removeListener<K extends keyof EventsMap>(
    event: K,
    listener: ListenerType<Events, EventsMap, K>,
  ): void {
    if (!this.listeners[event]) return;
    const index = this.listeners[event].indexOf(listener);
    if (index >= 0) {
      this.listeners[event].splice(index, 1);
    }
  }
  off<K extends keyof EventsMap>(event: K, listener: ListenerType<Events, EventsMap, K>): void {
    this.removeListener(event, listener);
  }

  removeListenersForEvent(event: keyof EventsMap): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = [];
  }
  removeAllListeners(): void {
    this.listeners = {};
  }

  private _executeEvent<K extends keyof EventsMap>({
    event,
    args,
  }: QueuedEvent<EventsMap, K>): void {
    this.listeners[event]?.forEach((listener) => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error handling event [${String(event)}]:`, error);
      }
    });
  }
}
