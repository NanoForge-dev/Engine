import { type InitContext } from "../../../context";
import { type ISoundLibrary } from "../interfaces";
import { Library } from "../library";

/**
 * Abstract base class for sound libraries.
 *
 * @remarks
 * Extend this class to implement a custom sound library and register it with
 * `NanoforgeClient.useSound`.  The built-in implementation is
 * `SoundLibrary`.
 */
export abstract class BaseSoundLibrary extends Library implements ISoundLibrary {
  /** @internal */
  public abstract override __init(context: InitContext): Promise<void>;

  /**
   * Play a previously loaded sound effect.
   *
   * @param sound - Key that identifies the sound (as passed to load).
   * @throws `NfNotFound` When no sound is registered under the given key.
   * @throws `NfNotInitializedException` When called before `__init` has resolved.
   */
  public abstract play(sound: string): void;

  /**
   * Toggle the muted state of all loaded sound effects.
   *
   * @throws `NfNotInitializedException` When called before `__init` has resolved.
   */
  public abstract mute(): void;
}
