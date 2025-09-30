import {
  type ApplicationContext,
  ClearContext,
  type IRunOptions,
  type IRunnerLibrary,
  InitContext,
  type LibraryHandle,
  LibraryStatusEnum,
} from "@nanoforge/common";

import { type ApplicationConfig } from "../application/application-config";
import type { IApplicationOptions } from "../application/application-options.type";
import { EditableExecutionContext } from "../common/context/contexts/executions/execution.editable-context";
import { type EditableLibraryContext } from "../common/context/contexts/library.editable-context";
import { ConfigRegistry } from "../config/config-registry";

export class Core {
  private readonly config: ApplicationConfig;
  private readonly context: ApplicationContext;
  private options: IApplicationOptions;
  private _configRegistry: ConfigRegistry;

  constructor(config: ApplicationConfig, context: ApplicationContext) {
    this.config = config;
    this.context = context;
  }

  public async init(options: IRunOptions, appOptions: IApplicationOptions): Promise<void> {
    this.options = appOptions;
    this._configRegistry = new ConfigRegistry(appOptions.environment);
    await this.runInit(this.getInitContext(options));
  }

  public async run(): Promise<void> {
    const context = this.getExecutionContext();
    const libraries = this.config.libraryManager.getExecutionLibraries();
    let requestAnimationFrameHandle: number;

    const runner = async () => {
      await this.runExecute(context, libraries);
    };

    const render = () => {
      if (!context.isRunning) {
        clearInterval(intervalHandle);
        this.runClear(this.getClearContext());
        return;
      }
      cancelAnimationFrame(requestAnimationFrameHandle);
      requestAnimationFrameHandle = requestAnimationFrame(runner);
    };

    const intervalHandle = setInterval(render, 1000 / this.options.tickRate);
  }

  private getInitContext(options: IRunOptions): InitContext {
    return new InitContext(this.context, this.config.libraryManager, this._configRegistry, options);
  }

  private getExecutionContext<T extends IRunnerLibrary>(): EditableExecutionContext<T> {
    return new EditableExecutionContext(this.context, this.config.libraryManager);
  }

  private getClearContext(): ClearContext {
    return new ClearContext(this.context, this.config.libraryManager);
  }

  private async runInit(context: InitContext): Promise<void> {
    for (const handle of this.config.libraryManager.getInitLibraries()) {
      await handle.library.init(context);
      (handle.context as EditableLibraryContext).setStatus(LibraryStatusEnum.LOADED);
    }
  }

  private async runExecute(
    context: EditableExecutionContext<IRunnerLibrary>,
    libraries: LibraryHandle<IRunnerLibrary>[],
  ) {
    for (const handle of libraries) {
      context.setCurrentLibrary(handle.library);
      await handle.library.run(context);
    }
  }

  private async runClear(context: ClearContext) {
    for (const handle of this.config.libraryManager.getClearLibraries()) {
      await handle.library.clear(context);
      (handle.context as EditableLibraryContext).setStatus(LibraryStatusEnum.CLEAR);
    }
  }
}
