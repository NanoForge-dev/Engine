import { type IConfigRegistry, type LibraryManager } from "../../../library";
import { type IRunClientOptions, type IRunOptions } from "../../../options";
import { type ApplicationContext } from "../application.context";
import { BaseContext } from "./base.context";

export class InitContext extends BaseContext {
  private readonly _canvas: IRunClientOptions["canvas"] | undefined;
  private readonly _files: IRunOptions["files"];
  private readonly _config: IConfigRegistry;

  constructor(
    context: ApplicationContext,
    libraryManager: LibraryManager,
    configRegistry: IConfigRegistry,
    options: IRunOptions,
  ) {
    super(context, libraryManager);

    this._canvas = (options as IRunClientOptions)["canvas"];
    this._files = options.files;
    this._config = configRegistry;
  }

  get canvas(): IRunClientOptions["canvas"] | undefined {
    return this._canvas;
  }

  get files(): IRunOptions["files"] {
    return this._files;
  }

  get config(): IConfigRegistry {
    return this._config;
  }
}
