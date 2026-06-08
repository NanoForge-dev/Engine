import { BaseMusicLibrary, NfNotFound } from "@nanoforge-dev/common";

/**
 * Built-in music library.
 *
 * @remarks
 * Manages a collection of named `HTMLAudioElement` instances and ensures only
 * one track plays at a time.  Load tracks with `load` and start
 * playback with `play`.  Register with the application:
 *
 * ```ts
 * client.use(MUSIC_LIBRARY, new MusicLibrary());
 * ```
 *
 * Access in game code:
 * ```ts
 * const music = ctx.libraries.getMusic<MusicLibrary>().library;
 * music.load("theme", "/music/main-theme.mp3");
 * music.play("theme");
 * ```
 */
export class MusicLibrary extends BaseMusicLibrary {
  private muted: boolean = true;
  private musics?: Map<string, HTMLAudioElement>;
  private current: HTMLAudioElement | null = null;

  /** @internal */
  get __name(): string {
    return "NfMusic";
  }

  /** @internal */
  public async __init(): Promise<void> {
    this.musics = new Map<string, HTMLAudioElement>();
    this.muted = true;
  }

  /**
   * Toggle the muted state of all loaded music tracks.
   *
   * @throws `NfNotInitializedException` When called before `__init` has resolved.
   */
  public mute(): void {
    if (!this.musics) this.throwNotInitializedError();
    this.muted = !this.muted;
    for (const [, element] of this.musics) {
      if (element) {
        element.muted = this.muted;
      }
    }
  }

  /**
   * Stop the currently playing track and start the requested one.
   *
   * @param music - Key that identifies the track (as passed to load).
   * @throws `NfNotFound` When no track is registered under the given key.
   * @throws `NfNotInitializedException` When called before `__init` has resolved.
   */
  public play(music: string): void {
    if (!this.musics) this.throwNotInitializedError();
    const musicElement = this.musics.get(music);

    if (musicElement) {
      this.current?.pause();
      this.current = musicElement;
      this.current
        ?.play()
        .then(() => {})
        .catch((e) => {
          console.error(`Got error: ${e}`);
        });
    } else {
      this.current = null;
      throw new NfNotFound(music);
    }
  }

  /**
   * Register a music track under a unique key.
   *
   * @remarks
   * Creates an `HTMLAudioElement` from the provided URL.  The track respects
   * the current muted state at load time.
   *
   * @param music - Unique key used to reference this track (e.g. "theme").
   * @param file - URL or path to the audio file.
   * @throws `NfNotInitializedException` When called before `__init` has resolved.
   */
  public load(music: string, file: string) {
    if (!this.musics) this.throwNotInitializedError();
    const element = new Audio(file);
    if (element) {
      element.muted = this.muted;
    }
    this.musics.set(music, element);
  }
}
