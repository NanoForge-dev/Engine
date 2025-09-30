import { type ILibrary } from "../../library.type";

export interface IMutableLibrary extends ILibrary {
  /**
   * mutes or unmutes the sound.
   */
  mute(): void;
}
