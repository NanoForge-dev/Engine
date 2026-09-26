import type { ViewportOptions } from "@nanoforge-dev/common";

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

/**
 * Options accepted by `NanoforgeFactory.createClient`.
 */
export interface ClientApplicationOptions extends ApplicationOptions {
  /**
   * Design resolution and fit mode of the game view. Game coordinates are
   * expressed in this resolution and scaled to the actual window size.
   *
   * @example
   * ```ts
   * NanoforgeFactory.createClient({ viewport: { width: 1920, height: 1080, fit: "contain" } });
   * ```
   */
  viewport?: ViewportOptions;
}
