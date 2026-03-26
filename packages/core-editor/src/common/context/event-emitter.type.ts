export enum EventTypeEnum {
  HOT_RELOAD = "hot-reload",
  HARD_RELOAD = "hard-reload",
}

export interface EventEmitter {
  eventQueue: (EventTypeEnum | string)[];
}
