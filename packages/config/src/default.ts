import { Transform } from "class-transformer";
import { type TransformFnParams } from "class-transformer/types/interfaces/metadata/transform-fn-params.interface";

export function Default(defaultValue: unknown): PropertyDecorator {
  return Transform(
    ({ value }: TransformFnParams) => value ?? JSON.parse(JSON.stringify(defaultValue)),
  );
}
