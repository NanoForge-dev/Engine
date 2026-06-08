import { Transform } from "class-transformer";

const transformStringToBoolean = ({ value }: { value: string }) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};

/**
 * Property decorator that transforms the string environment variable value
 * `"true"` or `"false"` into a native `boolean`.
 *
 * @remarks
 * Returns `undefined` for any value that is neither `"true"` nor `"false"`.
 * Pair with `@IsBoolean()` and `@Default(false)` for a fully validated and
 * defaulted boolean config property.
 *
 * @example
 * ```ts
 * class MyConfig {
 *   \@Expose()
 *   \@TransformToBoolean()
 *   \@IsBoolean()
 *   \@Default(false)
 *   FEATURE_FLAG!: boolean;
 * }
 * ```
 */
export const TransformToBoolean = () => Transform(transformStringToBoolean);
