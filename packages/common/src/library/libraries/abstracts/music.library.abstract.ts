import { type InitContext } from "../../../context";
import { type IMusicLibrary } from "../interfaces";
import { Library } from "../library";

/**
 * Abstract base class for music libraries.
 *
 * @remarks
 * Extend this class to implement a custom music library and register it with
 * `NanoforgeApplication.use` using the `MUSIC_LIBRARY` symbol.
 * The built-in implementation is `MusicLibrary`.
 */
export abstract class BaseMusicLibrary extends Library implements IMusicLibrary {
  /** @internal */
  public abstract override __init(context: InitContext): Promise<void>;

  /**
   * Stop the currently playing track (if any) and start playing the requested one.
   *
   * @param sound - Key that identifies the music track (as passed to load).
   * @throws `NfNotFound` When no track is registered under the given key.
   * @throws `NfNotInitializedException` When called before `__init` has resolved.
   */
  public abstract play(sound: string): void;

  /**
   * Toggle the muted state of all loaded music tracks.
   *
   * @throws `NfNotInitializedException` When called before `__init` has resolved.
   */
  public abstract mute(): void;
}
