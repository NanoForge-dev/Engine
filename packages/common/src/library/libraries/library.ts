import { type ClearContext, type InitContext } from "../../context";
import { NfNotInitializedException } from "../../exception";
import { RelationshipHandler } from "../relationship/relationship-handler";
import { DEFAULT_LIBRARY_OPTIONS } from "./consts/library-options-default.const";
import { type ILibrary, type ILibraryOptions } from "./library.type";

/**
 * Base class for all NanoForge libraries.
 *
 * @remarks
 * Extend this class (or one of its typed subclasses such as
 * `BaseAssetManagerLibrary`, `BaseSoundLibrary`, etc.) to create a
 * custom library.  At minimum you must implement the `ILibrary.__name`
 * getter and register the library with the engine before calling
 * `NanoforgeApplication.init`.
 *
 * @example
 * ```ts
 * import `Library, type InitContext ` from "@nanoforge-dev/common";
 *
 * const MY_LIBRARY = Symbol("MY_LIBRARY");
 *
 * class MyLibrary extends Library {
 *   get __name() `return "MyLibrary"; `
 *
 *   override async __init(ctx: InitContext) {
 *     // one-time setup here
 *   }
 * }
 *
 * const client = NanoforgeFactory.createClient();
 * client.use(MY_LIBRARY, new MyLibrary());
 * await client.init(`container, files, env `);
 * ```
 */
export abstract class Library implements ILibrary {
  protected _relationship: RelationshipHandler;

  /**
   * @param rawOptions - Optional dependency and execution-order overrides.
   */
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

  /** @internal */
  get __relationship(): RelationshipHandler {
    return this._relationship;
  }

  /** @internal */
  abstract get __name(): string;

  /** @internal */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async __init(_context: InitContext): Promise<void> {}

  /** @internal */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async __clear(_context: ClearContext): Promise<void> {}

  /** @internal */
  protected throwNotInitializedError(): never {
    throw new NfNotInitializedException(this.__name, "Library");
  }
}
