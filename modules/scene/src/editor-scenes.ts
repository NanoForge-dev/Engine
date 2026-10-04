import type { EditorValue } from "./editor-value";

/** A loaded scene, root first (`scenes` event). */
export interface EditorLoadedScene {
  id: string;
  params: EditorValue;
}

/** A scene var (`scenes` event). */
export interface EditorSceneVar {
  key: string;
  value: EditorValue;
  /** The id of the scene it belongs to (removed when it unloads). */
  owner?: string;
  persistent: boolean;
}

/** `scenes` event: the loaded scenes and the vars, sent when they changed. */
export interface EditorScenes {
  loaded: EditorLoadedScene[];
  vars: EditorSceneVar[];
  /** Ids of the scenes the editor can load (`SceneLibrary`'s `scenes`, and those seen). */
  known: string[];
}

/** Arguments of the scene commands the editor sends while playing. */
export interface SceneEditorCommands {
  /** Loads a scene: its id, its params, and the parent to load it under (an id or `"current"`). */
  "scenes-load": [string, EditorValue?, string?];
  /** Unloads a loaded scene and the scenes under it. */
  "scenes-unload": [string];
  /** Sets a var (makes it when missing): key, JSON value. */
  "scenes-set-var": [string, EditorValue];
}

declare module "@nanoforge-dev/editor-lib" {
  interface EditorFeatures {
    /** Emit `scenes` events, at most every `intervalMs`, when the scenes or the vars changed. */
    scenes?: { intervalMs: number };
  }
  interface EditorEventMap {
    scenes: [EditorScenes];
  }
  interface EditorCommandMap {
    "scenes-load": SceneEditorCommands["scenes-load"];
    "scenes-unload": SceneEditorCommands["scenes-unload"];
    "scenes-set-var": SceneEditorCommands["scenes-set-var"];
  }
}
