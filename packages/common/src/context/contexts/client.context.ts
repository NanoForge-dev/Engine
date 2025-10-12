import { type ClientLibraryManager } from "../../library";
import type { ApplicationContext } from "./application.context";

export class Context {
  private readonly _applicationContext: ApplicationContext;
  private readonly _libraryManager: ClientLibraryManager;

  constructor(applicationContext: ApplicationContext, libraryManager: ClientLibraryManager) {
    this._applicationContext = applicationContext;
    this._libraryManager = libraryManager;
  }

  get app(): ApplicationContext {
    return this._applicationContext;
  }

  get libs(): ClientLibraryManager {
    return this._libraryManager;
  }
}
