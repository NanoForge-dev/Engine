import { BaseContext } from "./base.context";

/**
 * Context passed to a library's `__clear` lifecycle hook during application shutdown.
 *
 * @remarks
 * Use the inherited `application` and `libraries` accessors to access shared
 * state and other libraries while tearing down resources.
 */
export class ClearContext extends BaseContext {}
