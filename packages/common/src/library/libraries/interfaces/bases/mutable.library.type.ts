import { type ILibrary } from "../../library.type";

/**
 * Interface for libraries that support muting/unmuting audio playback.
 *
 * @remarks
 * Implemented by `ISoundLibrary` and `IMusicLibrary`.
 */
export interface IMutableLibrary extends ILibrary {
  /**
   * Toggle the muted state.  Mutes when currently unmuted, and vice versa.
   */
  mute(): void;
}
