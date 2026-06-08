import { type ClearContext, type InitContext } from "../../context";
import { type RelationshipHandler } from "../relationship/relationship-handler";

/**
 * Core interface that every NanoForge library must satisfy.
 *
 * @remarks
 * Implement this interface (or extend an abstract base such as `BaseAssetManagerLibrary`)
 * to create a custom library and register it with the engine via
 * `NanoforgeApplication.use`.
 */
export interface ILibrary {
  /** @internal */
  get __name(): string;

  /** @internal */
  get __relationship(): RelationshipHandler;

  /** @internal */
  __init(context: InitContext): Promise<void>;

  /** @internal */
  __clear(context: ClearContext): Promise<void>;
}

/**
 * Options that control how a library participates in the engine's
 * initialisation and execution ordering.
 */
export interface ILibraryOptions {
  /**
   * Symbols of libraries that must be fully initialised before this library
   * can be used.
   *
   * @remarks
   * The engine will reject configurations where a dependency is missing.
   */
  dependencies: symbol[];

  /**
   * Symbols of libraries whose `__run` method should be called *after* this
   * library's `__run`.
   */
  runBefore: symbol[];

  /**
   * Symbols of libraries whose `__run` method must complete *before* this
   * library's `__run` is invoked.
   */
  runAfter: symbol[];
}
