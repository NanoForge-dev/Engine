import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

import { NfEnvValidationException } from "./env-validation.exception";

/**
 * Validates a raw environment object against a `class-validator`-decorated
 * class and returns a populated instance.
 *
 * @remarks
 * Callable from anywhere — inside a library's own `__init(ctx)` (reading
 * `ctx.env`), or from an app's `main.ts` before constructing the
 * application. Not tied to `@nanoforge-dev/core` in any way.
 *
 * @param EnvClass - A class decorated with `class-validator`/`class-transformer` decorators.
 * @param env - Raw, unvalidated environment values (e.g. `process.env` or `InitContext.env`).
 * @throws `NfEnvValidationException` When validation fails.
 */
export const registerEnv = async <T extends object>(
  EnvClass: new () => T,
  env: Record<string, unknown>,
): Promise<T> => {
  const data = plainToInstance(EnvClass, env, { excludeExtraneousValues: true });
  const errors = await validate(data);
  if (errors.length > 0) throw new NfEnvValidationException(errors);
  return data;
};
