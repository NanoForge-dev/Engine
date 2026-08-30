import {
  type Context,
  type InitContext,
  Library,
  NfDuplicateLibraryException,
  NfNotInitializedException,
} from "@nanoforge-dev/common";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NanoforgeServer } from "../src/application/nanoforge-server";

class RecordingLibrary extends Library {
  public capturedContext?: Context;
  public runCount = 0;
  public eventsCount = 0;
  public clearCount = 0;

  constructor(
    public readonly key: string,
    private readonly initLog: string[],
    options?: ConstructorParameters<typeof Library>[0],
  ) {
    super(options);
  }

  override async __init(_ctx: InitContext): Promise<void> {
    this.initLog.push(this.key);
  }

  override async __events(ctx: Context): Promise<void> {
    this.eventsCount++;
    this.capturedContext = ctx;
  }

  override async __run(ctx: Context): Promise<void> {
    this.runCount++;
    this.capturedContext = ctx;
  }

  override async __clear(_ctx: Context): Promise<void> {
    this.clearCount++;
  }

  override expose(): { key: string } {
    return { key: this.key };
  }
}

class StoppingLibrary extends Library {
  readonly key = "stopper";
  public runCount = 0;
  public clearCount = 0;

  override async __run(ctx: Context): Promise<void> {
    this.runCount++;
    ctx.app.requestStop();
  }

  override async __clear(): Promise<void> {
    this.clearCount++;
  }
}

const makeRunOptions = () => ({ files: new Map<string, string>(), env: {} });

describe("NanoforgeApplication", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("use", () => {
    it("throws NfDuplicateLibraryException on a duplicate key", async () => {
      const server = new NanoforgeServer();
      server.use(new RecordingLibrary("a", []));
      expect(() => server.use(new RecordingLibrary("a", []))).toThrow(NfDuplicateLibraryException);
    });

    it("throws NfDuplicateLibraryException on a reserved key", () => {
      const server = new NanoforgeServer();
      expect(() => server.use(new RecordingLibrary("assets", []))).toThrow(
        NfDuplicateLibraryException,
      );
      expect(() => server.use(new RecordingLibrary("app", []))).toThrow(
        NfDuplicateLibraryException,
      );
      expect(() => server.use(new RecordingLibrary("vars", []))).toThrow(
        NfDuplicateLibraryException,
      );
    });

    it("throws after init() has been called", async () => {
      const server = new NanoforgeServer();
      await server.init(makeRunOptions());
      expect(() => server.use(new RecordingLibrary("late", []))).toThrow();
    });
  });

  describe("init", () => {
    it("initializes libraries in dependency order", async () => {
      const log: string[] = [];
      const server = new NanoforgeServer();
      const a = new RecordingLibrary("a", log, { dependencies: ["b"] });
      const b = new RecordingLibrary("b", log);
      server.use(a);
      server.use(b);

      await server.init(makeRunOptions());

      expect(log).toEqual(["b", "a"]);
    });

    it("makes ctx.assets available without it being explicitly registered", async () => {
      const server = new NanoforgeServer();
      const probe = new RecordingLibrary("probe", []);
      server.use(probe);
      await server.init(makeRunOptions());

      vi.useFakeTimers();
      await server.run();
      await vi.advanceTimersByTimeAsync(50);

      expect(probe.capturedContext?.assets).toBeDefined();
      expect(typeof probe.capturedContext?.assets.getAsset).toBe("function");
    });

    it("assigns a library's expose() result to ctx[key]", async () => {
      const server = new NanoforgeServer();
      const probe = new RecordingLibrary("probe", []);
      server.use(probe);
      await server.init(makeRunOptions());

      vi.useFakeTimers();
      await server.run();
      await vi.advanceTimersByTimeAsync(50);

      expect((probe.capturedContext as any).probe).toEqual({ key: "probe" });
    });
  });

  describe("run", () => {
    it("throws NfNotInitializedException if called before init()", async () => {
      const server = new NanoforgeServer();
      await expect(server.run()).rejects.toThrow(NfNotInitializedException);
    });

    it("calls __run each tick and stops after requestStop()", async () => {
      vi.useFakeTimers();

      const server = new NanoforgeServer({ tickRate: 1000 });
      const stopper = new StoppingLibrary();
      server.use(stopper);
      await server.init(makeRunOptions());

      await server.run();
      await vi.advanceTimersByTimeAsync(10); // tick 1: __run fires, requests stop
      await vi.advanceTimersByTimeAsync(10); // tick 2: sees isRunning === false, runs __clear

      expect(stopper.runCount).toBe(1);
      expect(stopper.clearCount).toBe(1);
    });

    it("skips __run on every library while paused, then resumes", async () => {
      vi.useFakeTimers();

      const server = new NanoforgeServer({ tickRate: 60 });
      const probe = new RecordingLibrary("probe", []);
      server.use(probe);
      await server.init(makeRunOptions());

      await server.run();
      await vi.advanceTimersByTimeAsync(1); // let the first tick fire
      const runsBeforePause = probe.runCount;
      expect(runsBeforePause).toBeGreaterThan(0);

      probe.capturedContext!.app.requestPause();
      await vi.advanceTimersByTimeAsync(200); // many tick intervals while paused
      expect(probe.runCount).toBe(runsBeforePause);
      expect(probe.capturedContext!.app.isPaused).toBe(true);

      probe.capturedContext!.app.requestResume();
      await vi.advanceTimersByTimeAsync(50); // at least one more tick after resume
      expect(probe.runCount).toBeGreaterThan(runsBeforePause);
    });

    it("keeps calling __events every tick while paused, unlike __run", async () => {
      vi.useFakeTimers();

      const server = new NanoforgeServer({ tickRate: 60 });
      const probe = new RecordingLibrary("probe", []);
      server.use(probe);
      await server.init(makeRunOptions());

      await server.run();
      await vi.advanceTimersByTimeAsync(1); // let the first tick fire
      const runsBeforePause = probe.runCount;
      const eventsBeforePause = probe.eventsCount;
      expect(runsBeforePause).toBeGreaterThan(0);
      expect(eventsBeforePause).toBeGreaterThan(0);

      probe.capturedContext!.app.requestPause();
      await vi.advanceTimersByTimeAsync(200); // many tick intervals while paused

      expect(probe.runCount).toBe(runsBeforePause); // __run stayed skipped
      expect(probe.eventsCount).toBeGreaterThan(eventsBeforePause); // __events kept running

      probe.capturedContext!.app.requestResume();
      await vi.advanceTimersByTimeAsync(50);
      expect(probe.runCount).toBeGreaterThan(runsBeforePause);
    });

    it("resumes on the same tick an event handler calls requestResume(), since __events runs before the pause check", async () => {
      vi.useFakeTimers();

      class EditorStandIn extends Library {
        readonly key = "editor";
        private _resumeQueued = false;

        queueResume(): void {
          this._resumeQueued = true;
        }

        override async __events(ctx: Context): Promise<void> {
          if (this._resumeQueued) {
            ctx.app.requestResume();
            this._resumeQueued = false;
          }
        }
      }

      const server = new NanoforgeServer({ tickRate: 60 });
      const editor = new EditorStandIn();
      const probe = new RecordingLibrary("probe", []);
      server.use(editor);
      server.use(probe);
      await server.init(makeRunOptions());

      await server.run();
      await vi.advanceTimersByTimeAsync(1);
      probe.capturedContext!.app.requestPause();
      await vi.advanceTimersByTimeAsync(200);
      const runsWhilePaused = probe.runCount;

      editor.queueResume();
      await vi.advanceTimersByTimeAsync(50); // next tick: __events drains the resume, __run fires too

      expect(probe.runCount).toBeGreaterThan(runsWhilePaused);
    });
  });
});
