import { type LibraryManager } from "../../../library/manager/managers/library.manager";
import { type ApplicationContext } from "../application.context";

/**
 * Base context passed to library lifecycle hooks.
 *
 * @remarks
 * All execution context types (`InitContext`, `ClearContext`,
 * `ExecutionContext`) extend this class and expose `application` and
 * `libraries`.
 */
export class BaseContext {
  private readonly _applicationContext: ApplicationContext;
  private readonly _libraryManager: LibraryManager;

  /**
   * @param applicationContext - Shared application-level runtime state.
   * @param libraryManager - Manager giving access to all registered libraries.
   */
  constructor(applicationContext: ApplicationContext, libraryManager: LibraryManager) {
    this._applicationContext = applicationContext;
    this._libraryManager = libraryManager;
  }

  /**
   * Shared application-level runtime state (running flag, delta time, …).
   */
  get application(): ApplicationContext {
    return this._applicationContext;
  }

  /**
   * Manager that provides typed access to every library registered with the
   * current application.
   */
  get libraries(): LibraryManager {
    return this._libraryManager;
  }
}
