/** Public surface of `SoundLibrary`, exposed on `Context.sound`. */
export interface SoundContextApi {
  /** Registers a sound effect under a unique key, loaded from `file`. */
  load(key: string, file: string): void;
  /** Plays a previously loaded sound effect. Multiple sounds may overlap. */
  play(key: string): void;
  /** Toggles the muted state of every loaded sound effect. */
  mute(): void;
}
