import { type Context, type InitContext, Library, defineLibraryKey } from "@nanoforge-dev/common";

import { EditorBridge } from "./internal/editor-bridge";
import { EDITOR_INIT_HOOK, type EditorContextApi } from "./protocol";

/**
 * Editor bridge library.
 *
 * @remarks
 * Register it (`app.use(new EditorLibrary())`) in a game that may be started
 * by an editor host. When `RunOptions.editor` is given, it handles the base
 * commands (pause, resume, step, stop), reports the run state, provides
 * `Context.editor` and the features the editor asks for in its `welcome`
 * (frame stats, console output). Without `RunOptions.editor` it does nothing.
 *
 * Once the editor's `welcome` arrives, it calls `__editorInit(ctx)` on every
 * registered library that has it (see `EditorAwareLibrary`).
 */
export class EditorLibrary extends Library {
  readonly key = defineLibraryKey("editor");

  // Created with the library, before any `__init`: startup console output is kept.
  private readonly _bridge = new EditorBridge();

  constructor() {
    // Every other library runs after this one: commands apply to the tick they arrive in.
    super({ runAfter: ["*"] });
  }

  public override async __init(ctx: InitContext): Promise<void> {
    if (ctx.editor) this._bridge.connect(ctx.editor);
    else this._bridge.dispose();
  }

  /**
   * Drains the editor's commands every tick — in `__events`, so also while
   * paused (the `resume` command has to get through) — and runs the
   * libraries' `__editorInit` once the editor's `welcome` arrived.
   */
  public override async __events(ctx: Context): Promise<void> {
    if (!this._bridge.connected) return;
    this._bridge.start(ctx.app, ctx.viewport);
    this._bridge.drain();
    if (this._bridge.takeWelcomed()) await ctx.app.callHook(EDITOR_INIT_HOOK, ctx);
  }

  public override expose(): EditorContextApi | undefined {
    return this._bridge.connected ? this._bridge.facade() : undefined;
  }
}
