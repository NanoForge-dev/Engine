import { type IConfigRegistry, type LibraryManager } from "../../../library";
import { type IRunClientOptions, type IRunOptions } from "../../../options";
import { type ApplicationContext } from "../application.context";
import { BaseContext } from "./base.context";

export class InitContext extends BaseContext {
  private readonly _container: IRunClientOptions["container"] | undefined;
  private readonly _files: IRunOptions["files"];
  private readonly _env: Record<string, string | undefined>;
  private readonly _config: IConfigRegistry;

  constructor(
    context: ApplicationContext,
    libraryManager: LibraryManager,
    configRegistry: IConfigRegistry,
    options: IRunOptions,
  ) {
    super(context, libraryManager);

    this._container = (options as IRunClientOptions)["container"];
    this._files = options.files;
    this._env = options.env;
    this._config = configRegistry;
  }

  get container(): IRunClientOptions["container"] | undefined {
    return this._container;
  }

  get files(): IRunOptions["files"] {
    return this._files;
  }

  get env(): Record<string, string | undefined> {
    return this._env;
  }

  get config(): IConfigRegistry {
    return this._config;
  }
}
