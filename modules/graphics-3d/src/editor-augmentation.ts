/** Payload of the `graphics-camera` event: the matrices of the active camera, column-major. */
export interface EditorGraphicsCamera {
  /** World → camera matrix (inverse of the camera's world matrix). */
  view: number[];
  /**
   * Camera → clip matrix. It includes the viewport's crop, so its normalized
   * device coordinates span the canvas, which is drawn `visibleWidth` ×
   * `visibleHeight` CSS px at (`contentLeft`, `contentTop`) of the container
   * (see the `viewport` event).
   */
  projection: number[];
}

declare module "@nanoforge-dev/editor-lib" {
  interface EditorFeatures {
    /** Emit `graphics-camera` events: the active 3D camera now, then on every change. */
    graphicsCamera?: boolean;
  }
  interface EditorEventMap {
    "graphics-camera": [EditorGraphicsCamera];
    /** Answer to `graphics-capture`: the frame as a PNG data URL, or empty when there is no renderer. */
    "graphics-capture": [string];
  }
  interface EditorCommandMap {
    /** Renders a frame now, even while paused, and answers with a `graphics-capture` event. */
    "graphics-capture": [];
  }
}
