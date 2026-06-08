/**
 * Events that the NanoForge editor can emit to the running engine.
 */
export enum EventTypeEnum {
  /** Reload modules without restarting the engine (live-patch). */
  HOT_RELOAD = "hot-reload",
  /** Fully restart the engine with the latest changes. */
  HARD_RELOAD = "hard-reload",
}

/** Callback signature for event listeners. */
export type ListenerType = (...args: any[]) => void;

/**
 * Simple event emitter interface used for communication between the NanoForge
 * editor and the running engine.
 *
 * @remarks
 * Listeners are queued and processed via `runEvents` to keep the engine
 * loop deterministic.
 */
export interface IEventEmitter {
  /** Map of event names to their registered listeners. */
  listeners: Record<EventTypeEnum | string, ListenerType[]>;
  /** Queue of events waiting to be dispatched by `runEvents`. */
  eventQueue: { event: EventTypeEnum | string; args: any[] }[];

  /** Drain the event queue and invoke all matching listeners. */
  runEvents: () => void;

  /**
   * Enqueue an event for dispatching on the next `runEvents` call.
   *
   * @param event - Event name or EventTypeEnum value.
   * @param args - Optional arguments forwarded to listeners.
   */
  emitEvent: (event: EventTypeEnum, ...args: any) => void;

  /**
   * Register a listener for an event.  Alias: `on`.
   *
   * @param event - Event name to subscribe to.
   * @param listener - Callback invoked when the event fires.
   */
  addListener: (event: EventTypeEnum | string, listener: ListenerType) => void;
  /** Alias for `addListener`. */
  on: (event: EventTypeEnum | string, listener: ListenerType) => void;

  /**
   * Remove a previously registered listener.  Alias: `off`.
   *
   * @param event - Event name to unsubscribe from.
   * @param listener - The exact listener function to remove.
   */
  removeListener: (event: EventTypeEnum | string, listener: ListenerType) => void;
  /** Alias for `removeListener`. */
  off: (event: EventTypeEnum | string, listener: ListenerType) => void;

  /**
   * Remove all listeners registered for a specific event.
   *
   * @param event - Event name whose listeners should be cleared.
   */
  removeListenersForEvent: (event: EventTypeEnum | string) => void;
  /** Remove every registered listener across all events. */
  removeAllListeners: () => void;
}
