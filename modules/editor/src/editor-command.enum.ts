import { EditorBridgeCommand } from "./protocol";

/**
 * Reserved editor → engine command names, handled by `EditorLibrary` itself
 * (pause/resume/step/stop) — no app-side wiring needed.
 *
 * @example
 * ```ts
 * fromEditor.emit(EditorCommand.Pause);
 * ```
 */
export const EditorCommand = EditorBridgeCommand;
export type EditorCommand = EditorBridgeCommand;
