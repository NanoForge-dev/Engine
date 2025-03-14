import {
  type ApplicationContext,
  ClearContext,
  ExecutionContext,
  type IRunnerLibrary,
  InitContext,
  type LibraryHandle,
} from "@nanoforge/common";

import { type ApplicationConfig } from "../application/application-config";

export class Core {
  private readonly config: ApplicationConfig;
  private readonly context: ApplicationContext;

  constructor(config: ApplicationConfig, context: ApplicationContext) {
    this.config = config;
    this.context = context;
  }

  public run(): void {
    this.runInit(this.getInitContext());
    const context = this.getExecutionContext();
    const libraries = this.config.libraryManager.getRunnerLibraries();
    while (context.isRunning) {
      this.runExecute(context, libraries);
    }
    this.runClear(this.getClearContext());
  }

  private getInitContext(): InitContext {
    return new InitContext(this.context, this.config.libraryManager);
  }

  private getExecutionContext(): ExecutionContext {
    return new ExecutionContext(this.context, this.config.libraryManager);
  }

  private getClearContext(): ClearContext {
    return new ClearContext(this.context, this.config.libraryManager);
  }

  private runInit(context: InitContext) {
    for (const handle of this.config.libraryManager.getLibraries()) {
      handle.library.init(context);
    }
  }

  private runExecute(context: ExecutionContext, libraries: LibraryHandle<IRunnerLibrary>[]) {
    for (const handle of libraries) {
      handle.library.run(context);
    }
  }

  private runClear(context: ClearContext) {
    for (const handle of this.config.libraryManager.getLibraries()) {
      handle.library.clear(context);
    }
  }
}
