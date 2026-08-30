import { AssetLibrary } from "@nanoforge-dev/asset";
import {
  type ClientRunOptions,
  type Context,
  type InitContext,
  type Library,
  NfNotInitializedException,
  type RunOptions,
} from "@nanoforge-dev/common";

import { InternalAppState } from "../internal/internal-app-state";
import { InternalVarsState } from "../internal/internal-vars-state";
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

    const loop = async (): Promise<void> => {
      if (!context.app.isRunning) {
        for (const library of orderedForRun) await library.__clear(context);
        return;
      }

      const tickStart = Date.now();

      for (const library of orderedForRun) await library.__events(context);

      if (context.app.isPaused) {
        previousTick = tickStart;
      } else {
        this.appState.setDelta(tickStart - previousTick);
        for (const library of orderedForRun) await library.__run(context);
        previousTick = tickStart;
      }

      setTimeout(loop, tickLengthMs + tickStart - Date.now());
    };

    this.appState.setIsRunning(true);
    setTimeout(loop);
  }

  protected async initialize(options: RunOptions | ClientRunOptions): Promise<void> {
    const initContext: InitContext = { ...options, vars: this.varsState.asVarsContext() };

    for (const library of this.registry.getOrderedForInit()) {
      await library.__init(initContext);
    }

    this.context = this.registry.buildContext(
      this.appState.asAppContext(),
      this.varsState.asVarsContext(),
    );
  }
}
