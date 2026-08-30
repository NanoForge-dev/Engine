/**
 * Public surface of `EditorLibrary`, exposed on `Context.editor`.
 *
 * @remarks
 * Deliberately asymmetric: `emit` only sends to the editor, `on` only
 * listens for commands from the editor. `Context.editor` reaches every
 * registered library, so it must not let arbitrary library code impersonate
 * an editor command or eavesdrop on the outgoing channel — the reverse two
 * operations (listening on the outgoing channel, emitting on the incoming
 * one) are reserved for the external editor host, which holds its own
 * direct reference to both raw emitters.
 */
export interface EditorContextApi {
  /** Sends a notification to the editor (e.g. "a component moved"). */
  emit(event: string, ...args: unknown[]): void;
  /** Listens for a command from the editor (e.g. "hot-reload"). */
  on(event: string, listener: (...args: unknown[]) => void): void;
}
