/**
 * Reserved editor → engine command names that `EditorLibrary` handles
 * itself, wired directly onto `Context.app`'s pause/resume/stop actions.
 *
 * @remarks
 * An editor host can send these through the raw `fromEditor` emitter it
 * created (see `RunOptions.editor`) without any app-side wiring — no other
 * library needs to know about them.
 *
 * @example
 * ```ts
 * fromEditor.emit(EditorCommand.Pause);
 * ```
 */
export enum EditorCommand {
  Pause = "pause",
  Resume = "resume",
  Stop = "stop",
}
