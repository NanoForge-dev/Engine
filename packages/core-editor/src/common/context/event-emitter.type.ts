/** Callback signature for event listeners. */
export type ListenerType<
  Events extends string,
  EventsMap extends Record<Events, unknown[]>,
  K extends keyof EventsMap,
> = (...args: EventsMap[K]) => void;

/** Signature of the waiting for execution events. */
export type QueuedEvent<EventsMap, K extends keyof EventsMap = keyof EventsMap> = {
  event: K;
  args: EventsMap[K];
};

/**
 * Simple event emitter interface used for communication between the NanoForge
 * editor and the running engine.
 *
 * @remarks
 * Listeners are queued and processed via `runEvents` to keep the engine
 * loop deterministic.
 */
export interface IEventEmitter<Events extends string, EventsMap extends Record<Events, unknown[]>> {
  /** Map of event names to their registered listeners. */
  listeners: {
    [K in keyof EventsMap]?: ListenerType<Events, EventsMap, K>[];
  };

  /** Queue of events waiting to be dispatched by `runEvents`. */
  eventQueue: QueuedEvent<EventsMap>[];

  /** Drain the event queue and invoke all matching listeners. */
  runEvents(): void;

  /**
   * Enqueue an event for dispatching on the next `runEvents` call.
   *
   * @param event - Event name or EventTypeEnum value.
   * @param args - Optional arguments forwarded to listeners.
   */
  emitEvent<K extends keyof EventsMap>(event: K, ...args: EventsMap[K]): void;

  /**
   * Register a listener for an event.  Alias: `on`.
   *
   * @param event - Event name to subscribe to.
   * @param listener - Callback invoked when the event fires.
   */
  addListener<K extends keyof EventsMap>(
    event: K,
    listener: ListenerType<Events, EventsMap, K>,
  ): void;
  /** Alias for `addListener`. */
  on<K extends keyof EventsMap>(event: K, listener: ListenerType<Events, EventsMap, K>): void;

  /**
   * Remove a previously registered listener.  Alias: `off`.
   *
   * @param event - Event name to unsubscribe from.
   * @param listener - The exact listener function to remove.
   */
  removeListener<K extends keyof EventsMap>(
    event: K,
    listener: ListenerType<Events, EventsMap, K>,
  ): void;
  /** Alias for `removeListener`. */
  off<K extends keyof EventsMap>(event: K, listener: ListenerType<Events, EventsMap, K>): void;

  /**
   * Remove all listeners registered for a specific event.
   *
   * @param event - Event name whose listeners should be cleared.
   */
  removeListenersForEvent(event: keyof EventsMap): void;
  /** Remove every registered listener across all events. */
  removeAllListeners(): void;
}
