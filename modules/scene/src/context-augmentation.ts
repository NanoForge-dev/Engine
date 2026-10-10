import type { ScenesContextApi } from "./scenes-context.type";

declare module "@nanoforge-dev/common" {
  interface Context {
    scenes: ScenesContextApi;
  }
}
