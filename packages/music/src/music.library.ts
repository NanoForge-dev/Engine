import { BaseMusicLibrary, NfNotFound } from "@nanoforge/common";

export class MusicLibrary extends BaseMusicLibrary {
  private muted: boolean = true;
  private musics?: Map<string, HTMLAudioElement>;
  private current: HTMLAudioElement | null = null;

  get __name(): string {
    return "NfMusic";
  }

  public async __init(): Promise<void> {
    this.musics = new Map<string, HTMLAudioElement>();
    this.muted = true;
  }

  public mute(): void {
    if (!this.musics) this.throwNotInitializedError();
    this.muted = !this.muted;
    for (const [, element] of this.musics) {
      if (element) {
        element.muted = this.muted;
      }
    }
  }

  public play(music: string): void {
    if (!this.musics) this.throwNotInitializedError();
    const musicElement = this.musics.get(music);

    if (musicElement) {
      this.current?.pause();
      this.current = musicElement;
      this.current
        ?.play()
        .then(() => {})
        .catch((e) => {
          console.error(`Got error: ${e}`);
        });
    } else {
      this.current = null;
      throw new NfNotFound(music);
    }
  }

  public load(music: string, file: string) {
    if (!this.musics) this.throwNotInitializedError();
    const element = new Audio(file);
    if (element) {
      element.muted = this.muted;
    }
    this.musics.set(music, element);
  }
}
