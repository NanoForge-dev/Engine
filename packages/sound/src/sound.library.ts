import { BaseSoundLibrary, NfNotFound } from "@nanoforge-dev/common";

/**
 * Built-in sound-effect library.
 *
 * @remarks
 * Manages a collection of named `HTMLAudioElement` instances.  Load sounds
 * with `load` and trigger playback with `play`.  Register with
 * the application:
 *
 * ```ts
 * client.useSound(new SoundLibrary());
 * ```
 *
 * Access in game code:
 * ```ts
 * const sound = ctx.libraries.getSound<SoundLibrary>().library;
 * sound.load("explosion", "/sounds/explosion.mp3");
 * sound.play("explosion");
 * ```
 */
export class SoundLibrary extends BaseSoundLibrary {
  private muted: boolean = true;
  private sounds?: Map<string, HTMLAudioElement>;

  /** @internal */
  get __name(): string {
    return "NfSound";
  }

  /** @internal */
  public async __init(): Promise<void> {
    this.sounds = new Map<string, HTMLAudioElement>();
    this.muted = true;
  }

  /**
   * Toggle the muted state of all loaded sound effects.
   *
   * @throws `NfNotInitializedException` When called before `__init` has resolved.
   */
  public mute(): void {
    if (!this.sounds) this.throwNotInitializedError();
    this.muted = !this.muted;
    for (const [, element] of this.sounds) {
      if (element) {
        element.muted = this.muted;
      }
    }
  }

  /**
   * Play a previously loaded sound effect.
   *
   * @param sound - Key that identifies the sound (as passed to load).
   * @throws `NfNotFound` When no sound is registered under the given key.
   * @throws `NfNotInitializedException` When called before `__init` has resolved.
   */
  public play(sound: string): void {
    if (!this.sounds) this.throwNotInitializedError();
    const soundElement = this.sounds.get(sound);

    if (soundElement) {
      soundElement
        .play()
        .then(() => {})
        .catch((e) => {
          console.error(`Got error: ${e}`);
        });
    } else {
      throw new NfNotFound(sound);
    }
  }

  /**
   * Register a sound effect under a unique key.
   *
   * @remarks
   * Creates an `HTMLAudioElement` from the provided URL.  The sound respects
   * the current muted state at load time.
   *
   * @param sound - Unique key used to reference this sound (e.g. "explosion").
   * @param file - URL or path to the audio file.
   * @throws `NfNotInitializedException` When called before `__init` has resolved.
   */
  public load(sound: string, file: string) {
    if (!this.sounds) this.throwNotInitializedError();
    const element = new Audio(file);
    if (element) {
      element.muted = this.muted;
    }
    this.sounds.set(sound, element);
  }
}
