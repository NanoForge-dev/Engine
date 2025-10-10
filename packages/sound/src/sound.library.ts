import { BaseSoundLibrary, NfNotFound } from "@nanoforge/common";

export class SoundLibrary extends BaseSoundLibrary {
  private muted: boolean;
  private sounds: Map<string, HTMLAudioElement>;

  get __name(): string {
    return "NfSound";
  }

  public async __init(): Promise<void> {
    this.sounds = new Map<string, HTMLAudioElement>();
    this.muted = true;
  }

  public mute(): void {
    this.muted = !this.muted;
    for (const key in this.sounds) {
      const element = this.sounds[key];

      if (element) {
        element.muted = this.muted;
      }
    }
  }

  public play(sound: string): void {
    const soundElement = this.sounds.get(sound);

    if (soundElement) {
      soundElement
        .play()
        .then(() => {})
        .catch((e) => {
          console.error(`Got error: ${e}`);
        });
    } else {
      throw new NfNotFound(sound);
    }
  }

  public load(sound: string, file: string) {
    const element = new Audio(file);
    if (element) {
      element.muted = this.muted;
    }
    this.sounds.set(sound, element);
  }
}
