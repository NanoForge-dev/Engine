import type { InputContextApi } from "./input-context.type";

declare module "@nanoforge-dev/common" {
  interface Context {
    input: InputContextApi;
  }
}
