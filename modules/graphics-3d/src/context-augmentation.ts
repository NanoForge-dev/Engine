import type { Graphics3DContextApi } from "./graphics-context.type";

declare module "@nanoforge-dev/common" {
  interface Context {
    graphics: Graphics3DContextApi;
  }
}
