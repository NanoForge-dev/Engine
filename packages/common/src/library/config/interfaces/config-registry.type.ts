/**
 * Resolves and validates typed configuration objects from the runtime
 * environment.
 *
 * @remarks
 * An instance is available in `InitContext.config`.  Configuration
 * classes must be decorated with `class-transformer` (`@Expose`, `@Default`)
 * and `class-validator` (`@IsPort`, `@IsIpOrFQDN`, etc.) decorators from
 * `@nanoforge-dev/config`.
 *
 * @example
 * ```ts
 * import `Expose, IsPort ` from "@nanoforge-dev/config";
 *
 * class MyConfig {
 *   \@Expose() \@IsPort()
 *   PORT!: string;
 * }
 *
 * // Inside __init:
 * const cfg = await ctx.config.registerConfig(MyConfig);
 * console.log(cfg.PORT);
 * ```
 */
export interface IConfigRegistry {
  /**
   * Instantiate, populate from the runtime environment, transform, and
   * validate a configuration class.
   *
   * @typeParam T - Configuration class type.
   * @param config - Constructor of the configuration class.
   * @returns A validated, populated instance of the configuration class.
   * @throws `NfConfigException` When validation fails.
   */
  registerConfig<T extends object>(config: new () => T): Promise<T | never>;
}
