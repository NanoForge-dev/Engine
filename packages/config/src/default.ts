import { Transform } from "class-transformer";
import { type TransformFnParams } from "class-transformer/types/interfaces/metadata/transform-fn-params.interface";

/**
 * Property decorator that supplies a fallback value when the environment
 * variable is `undefined` or `null`.
 *
 * @remarks
 * Pairs with `class-transformer`'s `@Expose` and `class-validator` decorators.
 * The default is deep-cloned via `JSON.parse(JSON.stringify(…))` so objects
 * are not shared between instances.
 *
 * @param defaultValue - The value to use when the property is absent.
 *
 * @example
 * ```ts
 * class MyConfig {
 *   \@Expose()
 *   \@Default("localhost")
 *   HOST!: string;
 * }
 * ```
 */
export function Default(defaultValue: unknown): PropertyDecorator {
  return Transform(
    ({ value }: TransformFnParams) => value ?? JSON.parse(JSON.stringify(defaultValue)),
  );
}
