import { COMPONENT_SYSTEM_LIBRARY, type ILibrary, LibraryStatusEnum } from "@nanoforge-dev/common";
import { beforeEach, describe, expect, it } from "vitest";

import { Library } from "../../common/src/library/libraries/library";
import { EditableLibraryManager } from "../src/common/library/manager/library.manager";

class StubLibrary extends Library {
  private readonly _name: string;

  constructor(name: string, options?: ConstructorParameters<typeof Library>[0]) {
    super(options);
    this._name = name;
  }

  get __name(): string {
    return this._name;
  }
}

class StubRunnerLibrary extends StubLibrary {
  async __run(): Promise<void> {}
}

class StubMutableLibrary extends StubLibrary {
  mute(): void {}
}

describe("EditableLibraryManager", () => {
  let manager: EditableLibraryManager;

  beforeEach(() => {
    manager = new EditableLibraryManager();
  });

  describe("typed setters and getters", () => {
    it("should store and retrieve a component system library", () => {
      const lib = new StubLibrary("ComponentSystem");
      manager.setComponentSystem(lib as any);
      expect(manager.getComponentSystem().library).toBe(lib);
    });

    it("should store and retrieve a graphics library", () => {
      const lib = new StubLibrary("Graphics");
      manager.setGraphics(lib as any);
      expect(manager.getGraphics().library).toBe(lib);
    });

    it("should store and retrieve an asset manager library", () => {
      const lib = new StubLibrary("AssetManager");
      manager.setAssetManager(lib as any);
      expect(manager.getAssetManager().library).toBe(lib);
    });

    it("should store and retrieve a network library", () => {
      const lib = new StubLibrary("Network");
      manager.setNetwork(lib as any);
      expect(manager.getNetwork().library).toBe(lib);
    });

    it("should store and retrieve an input library", () => {
      const lib = new StubLibrary("Input");
      manager.setInput(lib as any);
      expect(manager.getInput().library).toBe(lib);
    });

    it("should store and retrieve a sound library", () => {
      const lib = new StubLibrary("Sound");
      manager.setSound(lib as any);
      expect(manager.getSound().library).toBe(lib);
    });

    it("should store and retrieve a music library", () => {
      const lib = new StubLibrary("Music");
      manager.setMusic(lib as any);
      expect(manager.getMusic().library).toBe(lib);
    });

    it("should throw when getting a typed library that was not set", () => {
      expect(() => manager.getComponentSystem()).toThrow();
    });
  });

  describe("set and get (custom symbol)", () => {
    it("should store and retrieve a library by Symbol.for key", () => {
      const sym = Symbol.for("customLib");
      const lib = new StubLibrary("Custom");

      manager.setAssetManager(new StubLibrary("Asset") as any);
      manager.set(sym, lib as unknown as ILibrary);

      expect(manager.get(sym).library).toBe(lib);
    });
  });

  describe("getLibraries", () => {
    it("should return the list of all set libraries", () => {
      const lib = new StubLibrary("ComponentSystem");
      manager.setComponentSystem(lib as any);
      const libs = manager.getLibraries().filter(Boolean);
      expect(libs.some((h) => h.library === (lib as unknown as ILibrary))).toBe(true);
    });
  });

  describe("getInitLibraries", () => {
    it("should return libraries in dependency order", () => {
      const libA = new StubLibrary("A", { dependencies: [COMPONENT_SYSTEM_LIBRARY] });
      const libB = new StubLibrary("B");

      manager.setComponentSystem(libB as any);
      manager.setGraphics(libA as any);

      const order = manager.getInitLibraries().map((h) => h.library.__name);
      const idxB = order.indexOf("B");
      const idxA = order.indexOf("A");

      expect(idxB).toBeLessThan(idxA);
    });

    it("should return all set libraries", () => {
      manager.setAssetManager(new StubLibrary("Asset") as any);
      manager.setGraphics(new StubLibrary("Graphics") as any);

      expect(manager.getInitLibraries().length).toBe(2);
    });
  });

  describe("getClearLibraries", () => {
    it("should return libraries in reverse dependency order", () => {
      const libA = new StubLibrary("A", { dependencies: [COMPONENT_SYSTEM_LIBRARY] });
      const libB = new StubLibrary("B");

      manager.setComponentSystem(libB as any);
      manager.setGraphics(libA as any);

      const order = manager.getClearLibraries().map((h) => h.library.__name);
      const idxA = order.indexOf("A");
      const idxB = order.indexOf("B");

      expect(idxA).toBeLessThan(idxB);
    });
  });

  describe("getExecutionLibraries", () => {
    it("should only return libraries that implement __run", () => {
      manager.setComponentSystem(new StubLibrary("NotARunner") as any);
      manager.setGraphics(new StubRunnerLibrary("Runner") as any);

      const runners = manager.getExecutionLibraries();
      expect(runners.every((h) => typeof (h.library as any).__run === "function")).toBe(true);
      expect(runners.some((h) => h.library.__name === "Runner")).toBe(true);
      expect(runners.some((h) => h.library.__name === "NotARunner")).toBe(false);
    });

    it("should return empty when no runner libraries are set", () => {
      manager.setComponentSystem(new StubLibrary("Static") as any);
      expect(manager.getExecutionLibraries()).toHaveLength(0);
    });
  });

  describe("getMutableLibraries", () => {
    it("should only return libraries that implement mute", () => {
      manager.setSound(new StubMutableLibrary("MutableSound") as any);
      manager.setGraphics(new StubLibrary("NonMutableGraphics") as any);

      const mutable = manager.getMutableLibraries();
      expect(mutable.some((h) => h.library.__name === "MutableSound")).toBe(true);
      expect(mutable.some((h) => h.library.__name === "NonMutableGraphics")).toBe(false);
    });

    it("should return empty when no mutable libraries are set", () => {
      manager.setGraphics(new StubLibrary("Graphics") as any);
      expect(manager.getMutableLibraries()).toHaveLength(0);
    });
  });

  describe("library context status", () => {
    it("should start with UNLOADED status", () => {
      manager.setComponentSystem(new StubLibrary("Comp") as any);
      expect(manager.getComponentSystem().context.status).toBe(LibraryStatusEnum.UNLOADED);
    });
  });
});
