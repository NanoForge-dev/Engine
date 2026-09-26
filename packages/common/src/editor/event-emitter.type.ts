/**
 * A generic, queued event emitter.
 *
 * @remarks
 * "Queued" means `emit` doesn't invoke listeners synchronously — it enqueues
 * the event, and `runEvents()` drains the queue, invoking listeners once per
 * call. This lets an event arriving mid-tick (e.g. from a WebSocket handler)
 * be applied at a controlled point instead of interrupting whatever else is
 * running.
 *
 * @typeParam Events - Union of event name literals.
 * @typeParam EventsMap - Maps each event name to its listener argument tuple.
 */
export interface EventEmitter<
  Events extends string = string,
  EventsMap extends Record<Events, any[]> = Record<Events, unknown[]>,
> {
  on<K extends Events>(event: K, listener: (...args: EventsMap[K]) => void): void;
  off<K extends Events>(event: K, listener: (...args: EventsMap[K]) => void): void;
  emit<K extends Events>(event: K, ...args: EventsMap[K]): void;
  /** Drains the queue, synchronously invoking listeners for each queued event. */
  runEvents(): void;
}
