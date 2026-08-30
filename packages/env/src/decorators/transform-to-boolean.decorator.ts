import { Transform } from "class-transformer";

const transformStringToBoolean = ({ value }: { value: string }): boolean | undefined => {
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
 * defaulted boolean property.
 */
export const TransformToBoolean = (): PropertyDecorator => Transform(transformStringToBoolean);
