import { BaseSoundLibrary } from "@nanoforge/common";
import { NfNotFound } from "@nanoforge/common/src/exceptions";

export class SoundLibrary extends BaseSoundLibrary {
  private sounds: Map<string, HTMLAudioElement>;

  get name(): string {
    return "NfSound";
  }

  public async init(): Promise<void> {
    this.sounds = new Map<string, HTMLAudioElement>();
  }

  public play(sound: string): void {
    const soundElement = this.sounds.get(sound);

    if (soundElement) {
      try {
        soundElement.play();
      } catch (e) {
        console.error(`Got error: ${e}`);
      }
    } else {
      throw new NfNotFound(sound);
    }
  }

  public load(sound: string, file: string) {
    this.sounds.set(sound, new Audio(file));
  }
}
