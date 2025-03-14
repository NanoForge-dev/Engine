import { type LibraryManager } from "../../../library";
import { type IRunOptions } from "../../../options";
import { type ApplicationContext } from "../application.context";
import { BaseContext } from "./base.context";

export class InitContext extends BaseContext {
  private readonly _canvas: IRunOptions["canvas"];
  private readonly _files: IRunOptions["files"];

  constructor(context: ApplicationContext, libraryManager: LibraryManager, options: IRunOptions) {
    super(context, libraryManager);

    this._canvas = options.canvas;
    this._files = options.files;
  }

  get canvas(): IRunOptions["canvas"] {
    return this._canvas;
  }

  get files(): IRunOptions["files"] {
    return this._files;
  }
}
