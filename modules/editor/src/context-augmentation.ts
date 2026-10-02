import type { EditorChannels, EditorContextApi } from "./protocol";

declare module "@nanoforge-dev/common" {
  interface Context {
    /** Editor bridge, when `EditorLibrary` is registered and an editor started the app. */
    readonly editor?: EditorContextApi;
  }

  interface RunOptions {
    /** Raw editor bridge, supplied by whoever starts the app under an editor host. */
    editor?: EditorChannels;
  }

  interface InitContext {
    editor?: EditorChannels;
  }
}
