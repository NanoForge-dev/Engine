import { type InitContext } from "../../../context";
import { type ISoundLibrary } from "../interfaces";
import { Library } from "../library";

export abstract class BaseSoundLibrary extends Library implements ISoundLibrary {
  public abstract __init(context: InitContext): Promise<void>;

  public abstract play(sound: string): void;

  /**
   * mutes or unmutes the sound.
   */
  public abstract mute(): void;
}
