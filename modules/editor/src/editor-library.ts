import {
  type Context,
  type EventEmitter,
  type InitContext,
  Library,
  defineLibraryKey,
} from "@nanoforge-dev/common";

import { EditorCommand } from "./editor-command.enum";
import type { EditorContextApi } from "./editor-context.type";

/**
 * Base editor bridge library.
 *
 * @remarks
 * Opt-in — register it only when the app is started under an editor host
 * (`app.use(new EditorLibrary())`), not a mandatory built-in like the asset
 * library. Reads the raw `toEditor`/`fromEditor` emitter pair from
 * `RunOptions.editor` (see `@nanoforge-dev/common`'s `RunOptions`
 * augmentation) and transforms them into the single `Context.editor` facade
 * every other library sees.
 */
export class EditorLibrary extends Library {
  readonly key = defineLibraryKey("editor");

  private _toEditor: EventEmitter | undefined;
  private _fromEditor: EventEmitter | undefined;
  private _baseCommandsWired = false;

  public override async __init(ctx: InitContext): Promise<void> {
    this._toEditor = ctx.editor?.toEditor;
    this._fromEditor = ctx.editor?.fromEditor;
  }

  /**
   * Drains queued editor → engine commands every tick — via `__events`, not
   * `__run`, so this keeps happening even while the app is paused. That's
   * what lets a queued "resume" command actually reach and lift the pause;
   * if this drained inside `__run` instead, a paused app could never
   * process the very command that would unpause it.
   *
   * Also wires the base `EditorCommand.Pause`/`.Resume`/`.Stop` commands
   * (once) directly onto `Context.app` — an editor host gets these three
   * actions for free, with no app-side listener code required.
   */
  public override async __events(ctx: Context): Promise<void> {
    if (!this._baseCommandsWired && this._fromEditor) {
      this._fromEditor.on(EditorCommand.Pause, () => ctx.app.requestPause());
      this._fromEditor.on(EditorCommand.Resume, () => ctx.app.requestResume());
      this._fromEditor.on(EditorCommand.Stop, () => ctx.app.requestStop());
      this._baseCommandsWired = true;
    }
    this._fromEditor?.runEvents();
  }

  public override expose(): EditorContextApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const library = this;
    return {
      emit: (event, ...args) => {
        if (!library._toEditor) library.throwNotInitializedError();
        library._toEditor?.emit(event, ...args);
      },
      on: (event, listener) => {
        if (!library._fromEditor) library.throwNotInitializedError();
        library._fromEditor?.on(event, listener);
      },
    };
  }
}
