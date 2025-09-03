import { type InitContext } from "../../../context";
import { type ISoundLibrary } from "../interfaces";
import { Library } from "../library";

export abstract class BaseSoundLibrary extends Library implements ISoundLibrary {
  public abstract init(context: InitContext): Promise<void>;

  public abstract play(sound: string): void;
}
