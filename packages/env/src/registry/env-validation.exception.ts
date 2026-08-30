import { NfException } from "@nanoforge-dev/common";
import type { ValidationError } from "class-validator";

/**
 * Thrown by `registerEnv` when the given environment doesn't satisfy the
 * target class's `class-validator` decorators.
 */
export class NfEnvValidationException extends NfException {
  get code(): number {
    return 400;
  }

  constructor(errors: ValidationError[]) {
    super(`Env validation failed: ${errors.toString()}`);
  }
}
