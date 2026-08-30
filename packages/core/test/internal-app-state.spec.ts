import { describe, expect, it } from "vitest";

import { InternalAppState } from "../src/internal/internal-app-state";

describe("InternalAppState", () => {
  it("reflects the configured tickRate", () => {
    const state = new InternalAppState(30);
    expect(state.asAppContext().tickRate).toBe(30);
  });

  it("starts not running, not paused, with zero delta", () => {
    const state = new InternalAppState(60);
    const ctx = state.asAppContext();
    expect(ctx.isRunning).toBe(false);
    expect(ctx.isPaused).toBe(false);
    expect(ctx.delta).toBe(0);
  });

  it("the returned view reflects live state, not a snapshot", () => {
    const state = new InternalAppState(60);
    const ctx = state.asAppContext();

    state.setIsRunning(true);
    state.setDelta(16);

    expect(ctx.isRunning).toBe(true);
    expect(ctx.delta).toBe(16);
  });

  it("requestStop() stops the run state", () => {
    const state = new InternalAppState(60);
    state.setIsRunning(true);
    const ctx = state.asAppContext();

    ctx.requestStop();

    expect(state.isRunning).toBe(false);
    expect(ctx.isRunning).toBe(false);
  });

  it("requestPause()/requestResume() toggle isPaused", () => {
    const state = new InternalAppState(60);
    const ctx = state.asAppContext();

    ctx.requestPause();
    expect(state.isPaused).toBe(true);
    expect(ctx.isPaused).toBe(true);

    ctx.requestResume();
    expect(state.isPaused).toBe(false);
    expect(ctx.isPaused).toBe(false);
  });

  it("has no setter reachable on the returned view", () => {
    const ctx = new InternalAppState(60).asAppContext();
    expect("setIsRunning" in ctx).toBe(false);
    expect("setIsPaused" in ctx).toBe(false);
    expect("setDelta" in ctx).toBe(false);
  });
});
