import { AssetLibrary } from "@nanoforge-dev/asset";
import {
  type ClientRunOptions,
  type Context,
  type InitContext,
  type Library,
  NfNotInitializedException,
  type RunOptions,
  type TickObserver,
} from "@nanoforge-dev/common";

import { InternalAppState } from "../internal/internal-app-state";
import { InternalVarsState } from "../internal/internal-vars-state";
import type { InternalViewportState } from "../internal/internal-viewport-state";
import { LibraryRegistry } from "../library-registry/library-registry";
import { type ApplicationOptions, DEFAULT_APPLICATION_OPTIONS } from "./application-options.type";

/**
 * Base class for client and server NanoForge applications.
 *
 * @remarks
 * Do not instantiate directly — use `NanoforgeFactory.createClient` or
 * `NanoforgeFactory.createServer` to get a fully configured instance of
 * `NanoforgeClient` or `NanoforgeServer`.
 *
 * @example
 * ```ts
 * const client = NanoforgeFactory.createClient(`tickRate: 30 `);
 * client.useAssetManager(new AssetManagerLibrary());
 * client.useGraphics(new Graphics2DLibrary());
 * await client.init(`container, files, env `);
 * client.run();
 * ```
 */
export abstract class NanoforgeApplication {
  private readonly registry = new LibraryRegistry();
  private readonly appState: InternalAppState;
  private readonly varsState = new InternalVarsState();
  private readonly options: ApplicationOptions;

  private context?: Context;

  /** Client-only viewport, created by `NanoforgeClient.init` before `initialize`. */
  protected viewport?: InternalViewportState;

  /**
   * @param options - Optional application-level settings such as tickRate.
   */
  constructor(options?: Partial<ApplicationOptions>) {
    this.options = { ...DEFAULT_APPLICATION_OPTIONS, ...options };
    this.appState = new InternalAppState(this.options.tickRate);
    this.registry.registerBuiltin(new AssetLibrary());
  }

  /**
   * Registers a library. Single argument — the library owns its own
   * context key (see `defineLibraryKey`).
   *
   * @param library - Library instance to register.
   *
   * @throws {@link NfDuplicateLibraryException} If the key is already
   * registered or reserved (`"app"`, `"vars"`, `"assets"`).
   */
  public use<L extends Library>(library: L): void {
    if (this.context) throw new Error("Cannot register libraries after init() has been called.");
    this.registry.register(library);
  }

  /**
   * Start the game loop.
   *
   * @remarks
   * Must be called after `init` has resolved.
   *
   * @throws `NfNotInitializedException` When called before `init`.
   */
  public async run(): Promise<void> {
    if (!this.context) throw new NfNotInitializedException("NanoforgeApplication");
    const context = this.context;
    const orderedForRun = this.registry.getOrderedForRun();

    const tickLengthMs = 1000 / this.options.tickRate;
    let previousTick = Date.now();

    const observers = this.appState.observers;
    let timed: TickObserver[] = [];
    const runHook = async (library: Library, hook: "__events" | "__run"): Promise<void> => {
      if (timed.length === 0) return library[hook](context);
      const start = performance.now();
      await library[hook](context);
      const ms = performance.now() - start;
      for (const observer of timed) observer.onHook?.(library.key, ms);
    };

    const loop = async (): Promise<void> => {
      if (!context.app.isRunning) {
        for (const library of orderedForRun) await library.__clear(context);
        this.viewport?.dispose();
        for (const observer of observers) observer.onStop?.();
        return;
      }

      const tickStart = Date.now();
      const tickTimer = performance.now();
      timed = [...observers].filter((observer) => observer.timings);

      for (const library of orderedForRun) await runHook(library, "__events");

      const step = this.appState.takeStep();
      if (context.app.isPaused && !step) {
        previousTick = tickStart;
      } else {
        this.appState.setDelta(step ? tickLengthMs : tickStart - previousTick);
        for (const library of orderedForRun) await runHook(library, "__run");
        previousTick = tickStart;
      }
      const tickMs = performance.now() - tickTimer;
      for (const observer of observers) observer.onTick?.(tickMs, Date.now());

      setTimeout(loop, tickLengthMs + tickStart - Date.now());
    };

    this.appState.setIsRunning(true);
    setTimeout(loop);
  }

  protected async initialize(options: RunOptions | ClientRunOptions): Promise<void> {
    const viewport = this.viewport?.asViewportContext();
    const initContext: InitContext = {
      ...options,
      vars: this.varsState.asVarsContext(),
      ...(viewport ? { viewport } : {}),
    };

    this.appState.setLibraries(
      this.registry.getAll().map((library) => library.key),
      this.registry.getOrderedForRun(),
    );

    for (const library of this.registry.getOrderedForInit()) {
      await library.__init(initContext);
    }

    this.context = this.registry.buildContext(
      this.appState.asAppContext(),
      this.varsState.asVarsContext(),
      viewport,
    );
  }
}
