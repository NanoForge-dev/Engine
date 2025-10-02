import { BaseMusicLibrary, NfNotFound } from "@nanoforge/common";

export class MusicLibrary extends BaseMusicLibrary {
  private muted: boolean;
  private musics: Map<string, HTMLAudioElement>;
  private current: HTMLAudioElement | null = null;

  get name(): string {
    return "NfMusic";
  }

  public async init(): Promise<void> {
    this.musics = new Map<string, HTMLAudioElement>();
    this.muted = true;
  }

  public mute(): void {
    this.muted = !this.muted;
    for (const key in this.musics) {
      const element = this.musics[key];

      if (element) {
        element.muted = this.muted;
      }
    }
  }

  public play(music: string): void {
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
    const element = new Audio(file);
    if (element) {
      element.muted = this.muted;
    }
    this.musics.set(music, element);
  }
}
