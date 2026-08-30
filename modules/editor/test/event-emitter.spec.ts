import { describe, expect, it, vi } from "vitest";

import { QueuedEventEmitter } from "../src";

describe("QueuedEventEmitter", () => {
  it("does not invoke listeners synchronously on emit", () => {
    const emitter = new QueuedEventEmitter<"ping", { ping: [] }>();
    const listener = vi.fn();
    emitter.on("ping", listener);

    emitter.emit("ping");

    expect(listener).not.toHaveBeenCalled();
  });

  it("invokes listeners with the emitted args once runEvents() is called", () => {
    const emitter = new QueuedEventEmitter<"move", { move: [number, number] }>();
    const listener = vi.fn();
    emitter.on("move", listener);

    emitter.emit("move", 1, 2);
    emitter.runEvents();

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith(1, 2);
  });

  it("supports multiple listeners for the same event", () => {
    const emitter = new QueuedEventEmitter<"ping", { ping: [] }>();
    const a = vi.fn();
    const b = vi.fn();
    emitter.on("ping", a);
    emitter.on("ping", b);

    emitter.emit("ping");
    emitter.runEvents();

    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
  });

  it("off() removes a listener", () => {
    const emitter = new QueuedEventEmitter<"ping", { ping: [] }>();
    const listener = vi.fn();
    emitter.on("ping", listener);
    emitter.off("ping", listener);

    emitter.emit("ping");
    emitter.runEvents();

    expect(listener).not.toHaveBeenCalled();
  });

  it("drains the queue so events are not re-delivered on a later runEvents()", () => {
    const emitter = new QueuedEventEmitter<"ping", { ping: [] }>();
    const listener = vi.fn();
    emitter.on("ping", listener);

    emitter.emit("ping");
    emitter.runEvents();
    emitter.runEvents();

    expect(listener).toHaveBeenCalledOnce();
  });

  it("catches a listener error so other listeners still run", () => {
    const emitter = new QueuedEventEmitter<"ping", { ping: [] }>();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const throwing = vi.fn(() => {
      throw new Error("boom");
    });
    const ok = vi.fn();
    emitter.on("ping", throwing);
    emitter.on("ping", ok);

    emitter.emit("ping");
    emitter.runEvents();

    expect(ok).toHaveBeenCalledOnce();
    expect(errorSpy).toHaveBeenCalledOnce();
    errorSpy.mockRestore();
  });
});
