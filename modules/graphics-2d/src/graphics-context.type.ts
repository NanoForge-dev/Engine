import type * as Graphics from "./exports/konva";

/** Public surface of `Graphics2DLibrary`, exposed on `Context.graphics`. */
export interface GraphicsContextApi {
  /**
   * The Konva `Stage`, scaled so its coordinates are in the viewport's design
   * resolution and resized on every viewport change.
   */
  readonly stage: Graphics.Stage;
  /** The default Konva `Layer` added to the stage — add shapes here to render them. */
  readonly baseLayer: Graphics.Layer;
}
