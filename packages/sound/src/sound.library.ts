import { BaseSoundLibrary } from "@nanoforge/common";

export class SoundLibrary extends BaseSoundLibrary {
  get name(): string {
    throw new Error("Method not implemented.");
  }

  public init(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public play(sound: string): void {
    throw new Error("Method not implemented.");
  }
}
