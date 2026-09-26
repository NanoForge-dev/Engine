import type { GraphicsContextApi } from "./graphics-context.type";

declare module "@nanoforge-dev/common" {
  interface Context {
    graphics: GraphicsContextApi;
  }
}
