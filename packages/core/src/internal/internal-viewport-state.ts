import {
  type ViewportContext,
  type ViewportOptions,
  type ViewportState,
  computeViewport,
} from "@nanoforge-dev/common";

type Listener = (state: ViewportState) => void;

const isSameState = (a: ViewportState, b: ViewportState): boolean =>
  (Object.keys(a) as (keyof ViewportState)[]).every((key) => a[key] === b[key]);

/**
 * The only place the client viewport can be mutated.
 *
 * @remarks
 * Never exported from this package. Tracks every source of a size change —
 * window `resize`, `fullscreenchange`, `visualViewport` resize, container
 * `ResizeObserver` and `devicePixelRatio` changes (monitor switch) — and
 * coalesces them into a single recompute per animation frame. Every browser
 * API is feature-checked so the class is usable in tests/headless setups.
 */
export class InternalViewportState {
  private readonly _container: HTMLDivElement;
  private _options: ViewportOptions;
  private _state: ViewportState;
  private readonly _listeners = new Set<Listener>();

  private _resizeObserver?: ResizeObserver;
  private _pixelRatioQuery?: MediaQueryList;
  private _pendingFrame?: number;

  constructor(container: HTMLDivElement, options: ViewportOptions = {}) {
    this._container = container;
    this._options = { ...options };
    this._container.style.overflow = "hidden";
    this._container.style.background = this._options.background ?? "black";
    this._state = this._compute();

    if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
      window.addEventListener("resize", this.scheduleUpdate);
      window.visualViewport?.addEventListener("resize", this.scheduleUpdate);
    }
    if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
      document.addEventListener("fullscreenchange", this.scheduleUpdate);
    }
    if (typeof ResizeObserver !== "undefined") {
      this._resizeObserver = new ResizeObserver(this.scheduleUpdate);
      this._resizeObserver.observe(container);
    }
    this._watchPixelRatio();
  }

  get state(): ViewportState {
    return this._state;
  }

  setOptions(options: ViewportOptions): void {
    this._options = { ...this._options, ...options };
    if (options.background !== undefined) this._container.style.background = options.background;
    this.refresh();
  }

  /** Recomputes the viewport now and notifies listeners if it changed. */
  refresh(): void {
    const next = this._compute();
    if (isSameState(this._state, next)) return;
    this._state = next;
    for (const listener of this._listeners) listener(next);
  }

  screenToGame(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this._container.getBoundingClientRect();
    const s = this._state;
    return {
      x: (clientX - rect.left - s.contentLeft - s.originX) / s.scaleX,
      y: (clientY - rect.top - s.contentTop - s.originY) / s.scaleY,
    };
  }

  gameToScreen(x: number, y: number): { x: number; y: number } {
    const rect = this._container.getBoundingClientRect();
    const s = this._state;
    return {
      x: rect.left + s.contentLeft + s.originX + x * s.scaleX,
      y: rect.top + s.contentTop + s.originY + y * s.scaleY,
    };
  }

  onChange(listener: Listener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /** Coalesces bursts of size-change events into one recompute per frame. */
  readonly scheduleUpdate = (): void => {
    if (typeof requestAnimationFrame === "undefined") {
      this.refresh();
      return;
    }
    if (this._pendingFrame !== undefined) return;
    this._pendingFrame = requestAnimationFrame(() => {
      this._pendingFrame = undefined;
      this.refresh();
    });
  };

  dispose(): void {
    if (typeof window !== "undefined" && typeof window.removeEventListener === "function") {
      window.removeEventListener("resize", this.scheduleUpdate);
      window.visualViewport?.removeEventListener("resize", this.scheduleUpdate);
    }
    if (typeof document !== "undefined" && typeof document.removeEventListener === "function") {
      document.removeEventListener("fullscreenchange", this.scheduleUpdate);
    }
    this._resizeObserver?.disconnect();
    this._resizeObserver = undefined;
    this._pixelRatioQuery?.removeEventListener("change", this._onPixelRatioChange);
    this._pixelRatioQuery = undefined;
    if (this._pendingFrame !== undefined && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(this._pendingFrame);
    }
    this._pendingFrame = undefined;
    this._listeners.clear();
  }

  asViewportContext(): ViewportContext {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const viewport = this;
    return {
      get state() {
        return viewport.state;
      },
      screenToGame: (clientX, clientY) => viewport.screenToGame(clientX, clientY),
      gameToScreen: (x, y) => viewport.gameToScreen(x, y),
      onChange: (listener) => viewport.onChange(listener),
      setOptions: (options) => viewport.setOptions(options),
      refresh: () => viewport.refresh(),
    };
  }

  private _compute(): ViewportState {
    return computeViewport(
      this._container.clientWidth,
      this._container.clientHeight,
      this._options,
      this._pixelRatio(),
    );
  }

  private _pixelRatio(): number {
    return typeof window !== "undefined" ? (window.devicePixelRatio ?? 1) : 1;
  }

  /**
   * A `(resolution: Xdppx)` query only fires once, when the ratio leaves `X`,
   * so it is re-armed for the new ratio every time it changes.
   */
  private _watchPixelRatio(): void {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    this._pixelRatioQuery = window.matchMedia(`(resolution: ${this._pixelRatio()}dppx)`);
    this._pixelRatioQuery.addEventListener("change", this._onPixelRatioChange);
  }

  private readonly _onPixelRatioChange = (): void => {
    this._pixelRatioQuery?.removeEventListener("change", this._onPixelRatioChange);
    this._watchPixelRatio();
    this.scheduleUpdate();
  };
}
