import { afterEach, describe, expect, it, vi } from "vitest";

import { NanoforgeServer } from "../src/application/nanoforge-server";

const options = { files: new Map(), env: {} };

describe("NanoforgeServer tick clock", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should time its ticks with a worker in a browser, where hidden tabs throttle timers", async () => {
    const workers: { onmessage: (() => void) | null; postMessage: ReturnType<typeof vi.fn> }[] = [];
    vi.stubGlobal("window", {});
    vi.stubGlobal(
      "Worker",
      vi.fn(function (this: (typeof workers)[number]) {
        this.onmessage = null;
        this.postMessage = vi.fn();
        workers.push(this);
      }),
    );
    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:clock") });
    const server = new NanoforgeServer({ tickRate: 50 });
    await server.init(options);

    await server.run();
    expect(workers).toHaveLength(1);
    expect(workers[0]!.postMessage).toHaveBeenCalledWith(0);

    workers[0]!.onmessage?.();
    await vi.waitFor(() => expect(workers[0]!.postMessage).toHaveBeenCalledTimes(2));
    expect(workers[0]!.postMessage.mock.calls[1]![0]).toBeGreaterThan(0);
    expect(workers).toHaveLength(1);
  });

  it("should use plain timers outside a browser", async () => {
    const timeout = vi.spyOn(globalThis, "setTimeout");
    vi.stubGlobal("Worker", vi.fn());
    const server = new NanoforgeServer({ tickRate: 50 });
    await server.init(options);

    await server.run();
    expect(timeout).toHaveBeenCalled();
    expect(Worker).not.toHaveBeenCalled();
  });
});
