/**
 * Events that the NanoForge editor can emit to the running engine.
 */
export enum CoreEvents {
  /** Reload only changed entity components params (live-patch) */
  HOT_RELOAD = "hot-reload",
  /** Reload all entities component params */
  HARD_RELOAD = "hard-reload",
  /** Don't execute the run function until UNPAUSE_GAME */
  PAUSE_GAME = "pause-game",
  /** End main loop and clear */
  STOP_GAME = "stop-game",
  /** resume executing the run function */
  UNPAUSE_GAME = "unpause-game",
}

export interface CoreEventsMap {
  [CoreEvents.HOT_RELOAD]: [];
  [CoreEvents.HARD_RELOAD]: [];
  [CoreEvents.PAUSE_GAME]: [];
  [CoreEvents.STOP_GAME]: [];
  [CoreEvents.UNPAUSE_GAME]: [];
}
