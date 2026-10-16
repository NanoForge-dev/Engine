import type { ControllerContextApi } from "./controller-context.type";

declare module "@nanoforge-dev/common" {
  interface Context {
    controller: ControllerContextApi;
  }
}
