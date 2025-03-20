import {
  type ApplicationContext,
  ClearContext,
  ExecutionContext,
  type IRunOptions,
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

  public async init(options: IRunOptions): Promise<void> {
    await this.runInit(this.getInitContext(options));
  }

  public async run(): Promise<void> {
    const context = this.getExecutionContext();
    const libraries = this.config.libraryManager.getRunnerLibraries();
    const runner = async () => {
      if (!context.isRunning) {
        return;
      }
      await this.runExecute(context, libraries);
      requestAnimationFrame(runner);
    };
    requestAnimationFrame(runner);
  }

  private getInitContext(options: IRunOptions): InitContext {
    return new InitContext(this.context, this.config.libraryManager, options);
  }

  private getExecutionContext(): ExecutionContext {
    return new ExecutionContext(this.context, this.config.libraryManager);
  }

  private getClearContext(): ClearContext {
    return new ClearContext(this.context, this.config.libraryManager);
  }

  private async runInit(context: InitContext): Promise<void> {
    for (const handle of this.config.libraryManager.getLibraries()) {
      if (handle) await handle.library.init(context);
    }
  }

  private async runExecute(context: ExecutionContext, libraries: LibraryHandle<IRunnerLibrary>[]) {
    for (const handle of libraries) {
      if (handle) await handle.library.run(context);
    }
  }

  private runClear(context: ClearContext) {
    for (const handle of this.config.libraryManager.getLibraries()) {
      if (handle) handle.library.clear(context);
    }
  }
}
