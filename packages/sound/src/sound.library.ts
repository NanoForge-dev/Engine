import { BaseSoundLibrary, NfNotFound } from "@nanoforge/common";

export class SoundLibrary extends BaseSoundLibrary {
  private muted: boolean = true;
  private sounds?: Map<string, HTMLAudioElement>;

  get __name(): string {
    return "NfSound";
  }

  public async __init(): Promise<void> {
    this.sounds = new Map<string, HTMLAudioElement>();
    this.muted = true;
  }

  public mute(): void {
    if (!this.sounds) this.throwNotInitializedError();
    this.muted = !this.muted;
    for (const [, element] of this.sounds) {
      if (element) {
        element.muted = this.muted;
      }
    }
  }

  public play(sound: string): void {
    if (!this.sounds) this.throwNotInitializedError();
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
    if (!this.sounds) this.throwNotInitializedError();
    const element = new Audio(file);
    if (element) {
      element.muted = this.muted;
    }
    this.sounds.set(sound, element);
  }
}
