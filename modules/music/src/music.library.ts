import { Library, NfNotFound, defineLibraryKey } from "@nanoforge-dev/common";
import type { EditorAwareLibrary, EditorInitContext } from "@nanoforge-dev/editor-lib";

import type { MusicContextApi } from "./music-context.type";

/**
 * Built-in music library.
 *
 * @remarks
 * Manages a collection of named `HTMLAudioElement` instances and ensures
 * only one track plays at a time — unlike `SoundLibrary`, starting a new
 * track pauses whichever one was playing.
 */
export class MusicLibrary extends Library implements EditorAwareLibrary {
  readonly key = defineLibraryKey("music");

  private _muted = true;
  /** Muted by the editor (`mute` bridge command), on top of the game's own state. */
  private _editorMuted = false;
  private _tracks?: Map<string, HTMLAudioElement>;
  private _current: HTMLAudioElement | null = null;

  public override async __init(): Promise<void> {
    this._tracks = new Map();
    this._muted = true;
    this._current = null;
  }

  /** Listens to the editor's `mute` command. */
  public async __editorInit(ctx: EditorInitContext): Promise<void> {
    ctx.editor.on("mute", (muted) => {
      this._editorMuted = muted;
      this._applyMuted();
    });
  }

  public override async __clear(): Promise<void> {
    this._current?.pause();
    this._current = null;
    for (const element of this._tracks?.values() ?? []) element.pause();
    this._tracks?.clear();
  }

  /**
   * Registers a music track under a unique key.
   *
   * @remarks
   * Creates an `HTMLAudioElement` from the given URL. The track respects
   * the current muted state at load time.
   */
  public load(key: string, file: string): void {
    if (!this._tracks) this.throwNotInitializedError();
    const element = new Audio(file);
    element.muted = this._muted || this._editorMuted;
    this._tracks.set(key, element);
  }

  /**
   * @throws `NfNotFound` When no track is registered under the given key.
   */
  public play(key: string): void {
    if (!this._tracks) this.throwNotInitializedError();
    const element = this._tracks.get(key);
    if (!element) {
      this._current = null;
      throw new NfNotFound(key);
    }

    this._current?.pause();
    this._current = element;
    this._current.play().catch((error: unknown) => {
      console.error(`Got error: ${error}`);
    });
  }

  /** Toggles the muted state of every loaded track. */
  public mute(): void {
    if (!this._tracks) this.throwNotInitializedError();
    this._muted = !this._muted;
    this._applyMuted();
  }

  public override expose(): MusicContextApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const library = this;
    return {
      load: (key, file) => library.load(key, file),
      play: (key) => library.play(key),
      mute: () => library.mute(),
    };
  }

  private _applyMuted(): void {
    for (const element of this._tracks?.values() ?? []) {
      element.muted = this._muted || this._editorMuted;
    }
  }
}
