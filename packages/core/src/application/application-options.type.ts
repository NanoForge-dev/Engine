/**
 * Options accepted by `NanoforgeFactory.createClient` and
 * `NanoforgeFactory.createServer`.
 */
export interface IApplicationOptions {
  /**
   * Target game-loop frequency in ticks per second.
   *
   * @default 60
   */
  tickRate: number;
}
