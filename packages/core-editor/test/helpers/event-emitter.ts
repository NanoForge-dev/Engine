import {
  type EventTypeEnum,
  type IEventEmitter,
  type ListenerType,
} from "../../src/common/context/event-emitter.type";

export class EventEmitter implements IEventEmitter {
  public listeners: Record<EventTypeEnum | string, ListenerType[]> = {};
  public eventQueue: { event: EventTypeEnum | string; args: any[] }[] = [];

  public runEvents = () => {
    this.eventQueue.forEach(({ event, args }) => {
      this.listeners[event]?.forEach((listener) => {
        listener(...args);
      });
    });
    this.eventQueue = [];
  };

  public emitEvent(event: EventTypeEnum | string, ...args: any[]) {
    this.eventQueue.push({ event, args });
  }

  public addListener(event: EventTypeEnum | string, listener: ListenerType): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(listener);
  }
  public on(event: EventTypeEnum | string, listener: ListenerType): void {
    this.addListener(event, listener);
  }

  public removeListener(event: EventTypeEnum | string, listener: ListenerType): void {
    if (!this.listeners[event]) return;
    const index = this.listeners[event].indexOf(listener);
    if (index >= 0) {
      this.listeners[event].splice(index, 1);
    }
  }
  public off(event: EventTypeEnum | string, listener: ListenerType): void {
    this.removeListener(event, listener);
  }

  public removeListenersForEvent(event: EventTypeEnum | string): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = [];
  }
  public removeAllListeners(): void {
    this.listeners = {};
  }
}
