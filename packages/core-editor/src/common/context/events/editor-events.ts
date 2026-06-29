export enum EditorEvents {
  MOVE_COMPONENT = "move-component",
}

export interface EditorEventsMap {
  [EditorEvents.MOVE_COMPONENT]: [
    entityId: string,
    componentId: string,
    position: { x: number; y: number },
  ];
}
