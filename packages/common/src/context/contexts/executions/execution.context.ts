import { BaseContext } from "./base.context";

/**
 * Context passed to a library's `__run` hook on every game-loop tick.
 *
 * @remarks
 * Use the inherited `application` and `libraries` accessors to read the current
 * delta time and interact with other libraries during the frame update.
 */
export class ExecutionContext extends BaseContext {}
