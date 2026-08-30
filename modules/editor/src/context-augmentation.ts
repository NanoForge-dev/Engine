import type { EditorContextApi } from "./editor-context.type";

declare module "@nanoforge-dev/common" {
  interface Context {
    editor: EditorContextApi;
  }
}
