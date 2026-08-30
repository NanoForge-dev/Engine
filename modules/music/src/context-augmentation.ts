import type { MusicContextApi } from "./music-context.type";

declare module "@nanoforge-dev/common" {
  interface Context {
    music: MusicContextApi;
  }
}
