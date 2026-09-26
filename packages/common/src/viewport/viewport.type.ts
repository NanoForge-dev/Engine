/**
 * How the game's design resolution is fitted into the client container,
 * mirroring CSS `object-fit`.
 *
 * - `"fill"`: stretches the game to the container; the aspect ratio is not kept.
 * - `"contain"`: scales uniformly so the whole game is visible (letterboxed).
 * - `"cover"`: scales uniformly so the container is filled (edges cropped).
 */
export type ViewportFit = "fill" | "contain" | "cover";

/**
 * Viewport settings a client application is created with.
 *
 * @remarks
 * When `width`/`height` are omitted, the design resolution is 1920x1080.
 */
export interface ViewportOptions {
  /**
   * Design (game-unit) width.
   *
   * @default 1920
   */
  width?: number;
  /**
   * Design (game-unit) height.
   *
   * @default 1080
   */
  height?: number;
  /**
   * How the design resolution is fitted into the container.
   *
   * @default "contain"
   */
  fit?: ViewportFit;
  /**
   * CSS background of the container, visible behind the canvas and in the
   * letterbox bars.
   *
   * @default "black"
   */
  background?: string;
}

/**
 * Immutable snapshot of the viewport, recomputed whenever the window or
 * container changes size.
 *
 * @remarks
 * All `CSS px` values are relative to the container's top-left corner.
 * A game point `(x, y)` is drawn at
 * `(contentLeft + originX + x * scaleX, contentTop + originY + y * scaleY)`.
 */
export interface ViewportState {
  /** Container width, in CSS px. */
  readonly containerWidth: number;
  /** Container height, in CSS px. */
  readonly containerHeight: number;
  /** `window.devicePixelRatio` at compute time. */
  readonly pixelRatio: number;
  /** Design width, in game units. */
  readonly designWidth: number;
  /** Design height, in game units. */
  readonly designHeight: number;
  /** Effective fit mode. */
  readonly fit: ViewportFit;
  /** Horizontal game → CSS px scale. */
  readonly scaleX: number;
  /** Vertical game → CSS px scale. */
  readonly scaleY: number;
  /** Width of the drawn area (the canvas size), in CSS px. */
  readonly visibleWidth: number;
  /** Height of the drawn area (the canvas size), in CSS px. */
  readonly visibleHeight: number;
  /** Horizontal letterbox offset of the drawn area inside the container, in CSS px (`contain`). */
  readonly contentLeft: number;
  /** Vertical letterbox offset of the drawn area inside the container, in CSS px (`contain`). */
  readonly contentTop: number;
  /** Horizontal crop offset (≤ 0) of the game origin inside the drawn area, in CSS px (`cover`). */
  readonly originX: number;
  /** Vertical crop offset (≤ 0) of the game origin inside the drawn area, in CSS px (`cover`). */
  readonly originY: number;
}

/**
 * Engine-owned viewport, available on the client as `Context.viewport` and
 * `InitContext.viewport`.
 *
 * @remarks
 * Tracks window/container size changes and maps between screen (client)
 * coordinates and game coordinates. Renderers subscribe with `onChange` to
 * resize/scale their output; pointer libraries use `screenToGame`.
 */
export interface ViewportContext {
  /** Current viewport snapshot. */
  readonly state: ViewportState;
  /** Converts a `MouseEvent.clientX/Y` position to game coordinates. */
  screenToGame(clientX: number, clientY: number): { x: number; y: number };
  /** Converts game coordinates to a `clientX/Y` position. */
  gameToScreen(x: number, y: number): { x: number; y: number };
  /**
   * Subscribes to viewport changes.
   *
   * @returns A function that removes the listener.
   */
  onChange(listener: (state: ViewportState) => void): () => void;
  /** Merges new options (e.g. a different `fit`) and recomputes the viewport. */
  setOptions(options: ViewportOptions): void;
  /** Forces an immediate recompute. */
  refresh(): void;
}
