import { describe, expect, it } from "vitest";

import { NfSceneCycleException, Scene } from "../src";
import { planMove, resolvePath } from "../src/scene-path";

class Game extends Scene {}
class Level1 extends Scene {
  static override parent = Game;
}
class RoomA extends Scene {
  static override parent = Level1;
}
class Level2 extends Scene {
  static override parent = Game;
}
class Pause extends Scene {}
class PauseOptions extends Scene {
  static override parent = Pause;
}

describe("resolvePath", () => {
  it("walks the static parents up to a root", () => {
    expect(resolvePath(RoomA, undefined, [])).toEqual([Game, Level1, RoomA]);
  });

  it("stops at the first loaded parent", () => {
    expect(resolvePath(Level2, undefined, [Game, Level1, RoomA])).toEqual([Game, Level2]);
  });

  it("is the loaded chain up to a loaded target", () => {
    expect(resolvePath(Level1, undefined, [Game, Level1, RoomA])).toEqual([Game, Level1]);
  });

  it("uses the parent given to the load", () => {
    expect(resolvePath(Pause, Level1, [Game, Level1])).toEqual([Game, Level1, Pause]);
    expect(resolvePath(Pause, RoomA, [])).toEqual([Game, Level1, RoomA, Pause]);
  });

  it("keeps the parent a loaded scene was loaded under", () => {
    expect(resolvePath(PauseOptions, undefined, [Game, Level1, Pause])).toEqual([
      Game,
      Level1,
      Pause,
      PauseOptions,
    ]);
  });

  it("moves a loaded scene under another parent", () => {
    expect(resolvePath(Pause, Game, [Game, Level1, Pause])).toEqual([Game, Pause]);
  });

  it("rejects a scene among its own parents", () => {
    class A extends Scene {
      static override parent: typeof Scene.parent;
    }
    class B extends Scene {
      static override parent = A;
    }
    A.parent = B;
    expect(() => resolvePath(A, undefined, [])).toThrow(NfSceneCycleException);
    expect(() => resolvePath(Game, Level1, [])).toThrow(NfSceneCycleException);
    expect(() => resolvePath(Game, Pause, [Game, Level1, Pause])).toThrow(NfSceneCycleException);
  });
});

describe("planMove", () => {
  const loaded = [Game, Level1, RoomA];

  it("loads a child without unloading", () => {
    expect(planMove([Game, Level1], [Game, Level1, RoomA])).toEqual({
      unload: [],
      load: [RoomA],
    });
  });

  it("unloads the children when moving to a parent", () => {
    expect(planMove(loaded, [Game])).toEqual({ unload: [RoomA, Level1], load: [] });
  });

  it("swaps a sibling and keeps the parents", () => {
    expect(planMove([Game, Level1], [Game, Level2])).toEqual({ unload: [Level1], load: [Level2] });
  });

  it("goes back to the shared parent for a cousin", () => {
    expect(planMove(loaded, [Game, Level2])).toEqual({
      unload: [RoomA, Level1],
      load: [Level2],
    });
  });

  it("loads every parent from nothing, root first", () => {
    expect(planMove([], loaded)).toEqual({ unload: [], load: loaded });
  });

  it("does nothing for the current scene", () => {
    expect(planMove(loaded, loaded)).toEqual({ unload: [], load: [] });
  });
});
