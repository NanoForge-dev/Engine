/** Public surface of `MusicLibrary`, exposed on `Context.music`. */
export interface MusicContextApi {
  /** Registers a music track under a unique key, loaded from `file`. */
  load(key: string, file: string): void;
  /** Stops the currently playing track (if any) and starts the requested one. */
  play(key: string): void;
  /** Toggles the muted state of every loaded track. */
  mute(): void;
}
