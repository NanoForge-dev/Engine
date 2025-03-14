import { type LibraryManager } from "../../../library/manager/managers/library.manager";
import { type ApplicationContext } from "../application.context";

export class BaseContext {
  private readonly _applicationContext: ApplicationContext;
  private readonly _libraryManager: LibraryManager;

  constructor(applicationContext: ApplicationContext, libraryManager: LibraryManager) {
    this._applicationContext = applicationContext;
    this._libraryManager = libraryManager;
  }

  get application(): ApplicationContext {
    return this._applicationContext;
  }

  get libraries(): LibraryManager {
    return this._libraryManager;
  }
}
