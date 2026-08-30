import { type EventEmitter } from "../editor";
import type { VarsContext } from "./context.type";

/**
 * Options every NanoForge application is started with.
 */
export interface RunOptions {
  /** Virtual file system, injected by the NanoForge loader. */
  files: Map<string, string>;
  /** Raw, unvalidated environment variables. */
  env: Record<string, string | undefined>;

  /**
   * Raw editor bridge, supplied by whoever starts the app under an editor
   * host. `EditorLibrary` transforms this pair into the single
   * `Context.editor` facade every library sees.
   */
  editor?: {
    /** Engine → editor channel. */
    toEditor: EventEmitter;
    /** Editor → engine channel. */
    fromEditor: EventEmitter;
  };
}

/**
 * Options a client application is started with.
 */
export interface ClientRunOptions extends RunOptions {
  /** DOM element the client should render into. */
  container: HTMLDivElement;
}

/**
 * Narrow context available to a library's `__init` hook.
 *
 * @remarks
 * `app` and `assets` are intentionally absent here: `app` doesn't exist yet
 * (the tick loop hasn't started), and `assets` isn't populated until every
 * library has finished initializing. Libraries that need raw files during
 * `__init` (e.g. the built-in asset library) read `files` directly.
 */
export interface InitContext {
  vars: VarsContext;
  env: Record<string, string | undefined>;
  files: Map<string, string>;
  container?: HTMLDivElement;
  editor?: RunOptions["editor"];
}
