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
import type { IApplicationOptions } from "../application/application-options.type";

export class Core {
  private readonly config: ApplicationConfig;
  private readonly context: ApplicationContext;
  private options: IApplicationOptions;

  constructor(config: ApplicationConfig, context: ApplicationContext) {
    this.config = config;
    this.context = context;
  }

  public async init(options: IRunOptions, appOptions: IApplicationOptions): Promise<void> {
    this.options = appOptions;
    await this.runInit(this.getInitContext(options));
  }

  public async run(): Promise<void> {
    const context = this.getExecutionContext();
    const libraries = this.config.libraryManager.getRunnerLibraries();
    let requestAnimationFrameHandle: number;

    const runner = async () => {
      await this.runExecute(context, libraries);
    };

    const render = () => {
      if (!context.isRunning) {
        clearInterval(intervalHandle);
        return;
      }
      cancelAnimationFrame(requestAnimationFrameHandle);
      requestAnimationFrameHandle = requestAnimationFrame(runner);
    };

    const intervalHandle = setInterval(render, 1000 / this.options.tickRate);
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
