import type { SoundContextApi } from "./sound-context.type";

declare module "@nanoforge-dev/common" {
  interface Context {
    sound: SoundContextApi;
  }
}
