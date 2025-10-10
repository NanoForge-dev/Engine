import { type InitContext } from "../../../context";
import { type IMusicLibrary } from "../interfaces";
import { Library } from "../library";

export abstract class BaseMusicLibrary extends Library implements IMusicLibrary {
  public abstract __init(context: InitContext): Promise<void>;

  public abstract play(sound: string): void;

  /**
   * mutes or unmutes the sound.
   */
  public abstract mute(): void;
}
