import type { Context, InitContext } from "../context";
import { NfNotInitializedException } from "../exception";
import { DEFAULT_LIBRARY_RELATIONSHIPS, type LibraryRelationships } from "./relationship.type";

/**
 * Base class for all NanoForge libraries.
 *
 * @remarks
 * Extend this class to create a custom library, then register an instance
 * with `app.use(new MyLibrary())`. A library owns its own context key (see
 * `defineLibraryKey`), which is simultaneously its registry identity, its
 * slot on `Context`, and the identifier used in `dependencies`/`runBefore`/
 * `runAfter`.
 *
 * @example
 * ```ts
 * import { Library, defineLibraryKey, type InitContext } from "@nanoforge-dev/common";
 *
 * class MyLibrary extends Library {
 *   readonly key = defineLibraryKey("my");
 *
 *   override async __init(ctx: InitContext) {
 *     // one-time setup here
 *   }
 * }
 *
 * app.use(new MyLibrary());
 * ```
 */
export abstract class Library {
  /**
   * This library's identity: its slot on `Context`, its registry key, and
   * the identifier used to reference it in ordering relationships.
   */
  abstract readonly key: string;

  private readonly _relationships: LibraryRelationships;

  /**
   * @param relationships - Optional ordering overrides, keyed by other
   * libraries' `key`.
   */
  constructor(relationships?: Partial<LibraryRelationships>) {
    this._relationships = {
      ...DEFAULT_LIBRARY_RELATIONSHIPS,
      ...relationships,
    };
  }

  /** @internal */
  get relationships(): LibraryRelationships {
    return this._relationships;
  }

  /** Called once, in dependency order, before the tick loop starts. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async __init(_ctx: InitContext): Promise<void> {}

  /**
   * Called every tick, in run order, whether or not the tick loop is
   * paused — unlike `__run`. Use this for event/message draining that must
   * not be affected by pause (e.g. an editor bridge listening for the
   * "resume" command itself), not for gameplay simulation.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async __events(_ctx: Context): Promise<void> {}

  /** Called every tick, in run order, while the tick loop is active and not paused. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async __run(_ctx: Context): Promise<void> {}

  /** Called once after the tick loop stops. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async __clear(_ctx: Context): Promise<void> {}

  /**
   * Returns this library's public contribution to `Context[this.key]`.
   *
   * @remarks
   * Return a plain object exposing only what game code should be able to
   * reach — never `this` — so internal state and lifecycle hooks never leak
   * onto `Context`. Libraries with nothing to expose (headless libraries)
   * can leave this unimplemented; they simply won't appear on `Context`.
   */
  expose(): unknown {
    return undefined;
  }

  protected throwNotInitializedError(): never {
    throw new NfNotInitializedException(this.key, "Library");
  }
}
