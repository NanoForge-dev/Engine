import { Library, NfNotFound, defineLibraryKey } from "@nanoforge-dev/common";

import type { SoundContextApi } from "./sound-context.type";

/**
 * Built-in sound-effect library.
 *
 * @remarks
 * Manages a collection of named `HTMLAudioElement` instances. Load sounds
 * with `load` and trigger playback with `play`. Unlike `MusicLibrary`,
 * multiple sounds may overlap — there's no single-track exclusivity.
 */
export class SoundLibrary extends Library {
  readonly key = defineLibraryKey("sound");

  private _muted = true;
  private _sounds?: Map<string, HTMLAudioElement>;

  public override async __init(): Promise<void> {
    this._sounds = new Map();
    this._muted = true;
  }

  public override async __clear(): Promise<void> {
    for (const element of this._sounds?.values() ?? []) element.pause();
    this._sounds?.clear();
  }

  /**
   * Registers a sound effect under a unique key.
   *
   * @remarks
   * Creates an `HTMLAudioElement` from the given URL. The sound respects
   * the current muted state at load time.
   */
  public load(key: string, file: string): void {
    if (!this._sounds) this.throwNotInitializedError();
    const element = new Audio(file);
    element.muted = this._muted;
    this._sounds.set(key, element);
  }

  /**
   * @throws `NfNotFound` When no sound is registered under the given key.
   */
  public play(key: string): void {
    if (!this._sounds) this.throwNotInitializedError();
    const element = this._sounds.get(key);
    if (!element) throw new NfNotFound(key);

    element.play().catch((error: unknown) => {
      console.error(`Got error: ${error}`);
    });
  }

  /** Toggles the muted state of every loaded sound effect. */
  public mute(): void {
    if (!this._sounds) this.throwNotInitializedError();
    this._muted = !this._muted;
    for (const element of this._sounds.values()) element.muted = this._muted;
  }

  public override expose(): SoundContextApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const library = this;
    return {
      load: (key, file) => library.load(key, file),
      play: (key) => library.play(key),
      mute: () => library.mute(),
    };
  }
}
