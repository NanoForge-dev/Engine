import type { EventEmitter } from "@nanoforge-dev/common";

/**
 * Default `EventEmitter` implementation. Construct one for each direction of
 * an editor bridge (`toEditor`/`fromEditor`) and hand both to `RunOptions.editor`.
 */
export class QueuedEventEmitter<
  Events extends string = string,
  EventsMap extends Record<Events, unknown[]> = Record<Events, unknown[]>,
> implements EventEmitter<Events, EventsMap> {
  private readonly listeners = new Map<Events, ((...args: EventsMap[Events]) => void)[]>();
  private readonly queue: { event: Events; args: EventsMap[Events] }[] = [];

  on<K extends Events>(event: K, listener: (...args: EventsMap[K]) => void): void {
    const list = this.listeners.get(event) ?? [];
    list.push(listener as (...args: EventsMap[Events]) => void);
    this.listeners.set(event, list);
  }

  off<K extends Events>(event: K, listener: (...args: EventsMap[K]) => void): void {
    const list = this.listeners.get(event);
    if (!list) return;
    this.listeners.set(
      event,
      list.filter(
        (registered) => registered !== (listener as (...args: EventsMap[Events]) => void),
      ),
    );
  }

  emit<K extends Events>(event: K, ...args: EventsMap[K]): void {
    this.queue.push({ event, args });
  }

  runEvents(): void {
    const pending = this.queue.splice(0, this.queue.length);
    for (const { event, args } of pending) {
      for (const listener of this.listeners.get(event) ?? []) {
        try {
          listener(...args);
        } catch (error) {
          console.error(error);
        }
      }
    }
  }
}
