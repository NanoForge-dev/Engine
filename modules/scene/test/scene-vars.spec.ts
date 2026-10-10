import { describe, expect, it } from "vitest";

import { Scene } from "../src";
import { SceneVarsStore } from "../src/scene-vars";

class Level extends Scene {}

describe("SceneVarsStore", () => {
  const setup = () => {
    const state: { owner?: Scene } = {};
    const store = new SceneVarsStore(() => state.owner as never);
    return { state, store, vars: store.api() };
  };

  it("inits a var only when it does not exist", () => {
    const { vars } = setup();
    expect(vars.init("score", 1)).toBe(1);
    expect(vars.init("score", 2)).toBe(1);
    expect(vars.get("score")).toBe(1);
  });

  it("sets an existing var, and makes a missing one", () => {
    const { vars } = setup();
    vars.init("score", 1);
    vars.set("score", 5);
    vars.set("lives", 3);
    expect(vars.get("score")).toBe(5);
    expect(vars.get("lives")).toBe(3);
  });

  it("has, removes and lists vars", () => {
    const { vars } = setup();
    vars.set("a", 1);
    vars.set("b", 2);
    expect(vars.has("a")).toBe(true);
    expect(vars.remove("a")).toBe(true);
    expect(vars.remove("a")).toBe(false);
    expect(vars.has("a")).toBe(false);
    expect(vars.get("a")).toBeUndefined();
    expect(vars.keys()).toEqual(["b"]);
  });

  it("removes the vars a scene made, not the persistent ones nor the others'", () => {
    const { state, store, vars } = setup();
    const level = new Level();
    const other = new Level();
    state.owner = level;
    vars.init("score", 0);
    vars.init("best", 0, { persistent: true });
    vars.set("seed", 4);
    state.owner = other;
    vars.set("score", 10); // keeps its owner
    vars.init("enemies", 3);
    state.owner = undefined;
    vars.init("global", 1);

    store.removeOwnedBy(level as never);

    expect(vars.keys().sort()).toEqual(["best", "enemies", "global"]);
  });

  it("makes an existing var persistent with set", () => {
    const { state, store, vars } = setup();
    const level = new Level();
    state.owner = level;
    vars.init("score", 0);
    vars.set("score", 1, { persistent: true });
    store.removeOwnedBy(level as never);
    expect(vars.get("score")).toBe(1);
  });

  it("returns the same api object every time", () => {
    const { store } = setup();
    expect(store.api()).toBe(store.api());
  });
});
