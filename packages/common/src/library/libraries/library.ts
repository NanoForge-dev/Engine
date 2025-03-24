import { type ClearContext, type InitContext } from "../../context";
import { RelationshipHandler } from "../relationship/relationship-handler";
import { DEFAULT_LIBRARY_OPTIONS } from "./consts/library-options-default.const";
import { type ILibrary, type ILibraryOptions } from "./library.type";

export abstract class Library implements ILibrary {
  protected _relationship: RelationshipHandler;

  constructor(rawOptions?: Partial<ILibraryOptions>) {
    const options = {
      ...DEFAULT_LIBRARY_OPTIONS,
      ...rawOptions,
    };

    this._relationship = new RelationshipHandler(
      options.dependencies,
      options.runBefore,
      options.runAfter,
    );
  }

  get relationship(): RelationshipHandler {
    return this._relationship;
  }

  abstract get name(): string;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async init(_context: InitContext): Promise<void> {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async clear(_context: ClearContext): Promise<void> {}
}
