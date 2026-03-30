export enum EventTypeEnum {
  HOT_RELOAD = "hot-reload",
  HARD_RELOAD = "hard-reload",
}

export type ListenerType = (...args: any[]) => void;

export interface IEventEmitter {
  listeners: Record<EventTypeEnum | string, ListenerType[]>;
  eventQueue: { event: EventTypeEnum | string; args: any[] }[];

  runEvents: () => void;

  emitEvent: (event: EventTypeEnum, ...args: any) => void;

  addListener: (event: EventTypeEnum | string, listener: ListenerType) => void;
  on: (event: EventTypeEnum | string, listener: ListenerType) => void;

  removeListener: (event: EventTypeEnum | string, listener: ListenerType) => void;
  off: (event: EventTypeEnum | string, listener: ListenerType) => void;

  removeListenersForEvent: (event: EventTypeEnum | string) => void;
  removeAllListeners: () => void;
}
