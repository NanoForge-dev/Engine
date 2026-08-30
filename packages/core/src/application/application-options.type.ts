/**
 * Options accepted by `NanoforgeFactory.createClient` and
 * `NanoforgeFactory.createServer`.
 */
export interface ApplicationOptions {
  /**
   * Target game-loop frequency in ticks per second.
   *
   * @default 60
   */
  tickRate: number;
}

export const DEFAULT_APPLICATION_OPTIONS: ApplicationOptions = {
  tickRate: 60,
};
