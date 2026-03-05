import { beforeEach, describe, expect, it } from "vitest";

import {
  LibraryContext,
  LibraryHandle,
  LibraryStatusEnum,
  NfNotInitializedException,
} from "../src";
import { Library } from "../src/library/libraries/library";
import { BaseLibraryManager } from "../src/library/manager/managers/base-library.manager";
import { RelationshipHandler } from "../src/library/relationship/relationship-handler";

class TestLibrary extends Library {
  private readonly _name: string;

  constructor(name = "TestLibrary", options?: ConstructorParameters<typeof Library>[0]) {
    super(options);
    this._name = name;
  }

  get __name(): string {
    return this._name;
  }

  public expose_throwNotInitializedError(): never {
    return this.throwNotInitializedError();
  }
}

class TestableBaseLibraryManager extends BaseLibraryManager {
  public expose_setNewLibrary(sym: symbol, library: TestLibrary, context: LibraryContext): void {
    this.setNewLibrary(sym, library, context);
  }
}

describe("RelationshipHandler", () => {
  it("should store dependencies", () => {
    const dep = Symbol("dep");
    const handler = new RelationshipHandler([dep], [], []);
    expect(handler.dependencies).toContain(dep);
  });

  it("should store runBefore", () => {
    const before = Symbol("before");
    const handler = new RelationshipHandler([], [before], []);
    expect(handler.runBefore).toContain(before);
  });

  it("should store runAfter", () => {
    const after = Symbol("after");
    const handler = new RelationshipHandler([], [], [after]);
    expect(handler.runAfter).toContain(after);
  });

  it("should return empty arrays when initialised with empty arrays", () => {
    const handler = new RelationshipHandler([], [], []);
    expect(handler.dependencies).toEqual([]);
    expect(handler.runBefore).toEqual([]);
    expect(handler.runAfter).toEqual([]);
  });

  it("should store multiple symbols", () => {
    const a = Symbol("a");
    const b = Symbol("b");
    const handler = new RelationshipHandler([a, b], [], []);
    expect(handler.dependencies).toEqual([a, b]);
  });
});

describe("Library", () => {
  describe("defaults", () => {
    it("should have empty relationship arrays when no options are given", () => {
      const lib = new TestLibrary();
      expect(lib.__relationship.dependencies).toEqual([]);
      expect(lib.__relationship.runBefore).toEqual([]);
      expect(lib.__relationship.runAfter).toEqual([]);
    });

    it("should expose the correct __name", () => {
      expect(new TestLibrary("MyLib").__name).toBe("MyLib");
    });
  });

  describe("options", () => {
    it("should use partial dependencies option", () => {
      const dep = Symbol("dep");
      const lib = new TestLibrary("TestLibrary", { dependencies: [dep] });
      expect(lib.__relationship.dependencies).toContain(dep);
    });

    it("should use partial runBefore option", () => {
      const before = Symbol("before");
      const lib = new TestLibrary("TestLibrary", { runBefore: [before] });
      expect(lib.__relationship.runBefore).toContain(before);
    });

    it("should use partial runAfter option", () => {
      const after = Symbol("after");
      const lib = new TestLibrary("TestLibrary", { runAfter: [after] });
      expect(lib.__relationship.runAfter).toContain(after);
    });
  });

  describe("throwNotInitializedError", () => {
    it("should throw NfNotInitializedException", () => {
      const lib = new TestLibrary();
      expect(() => lib.expose_throwNotInitializedError()).toThrow(NfNotInitializedException);
    });

    it("should include the library name in the error message", () => {
      const lib = new TestLibrary("MySpecialLib");
      expect(() => lib.expose_throwNotInitializedError()).toThrow(/MySpecialLib/);
    });
  });

  describe("__init and __clear", () => {
    it("__init should resolve without error by default", async () => {
      const lib = new TestLibrary();
      await expect(lib.__init({} as any)).resolves.toBeUndefined();
    });

    it("__clear should resolve without error by default", async () => {
      const lib = new TestLibrary();
      await expect(lib.__clear({} as any)).resolves.toBeUndefined();
    });
  });
});

describe("LibraryContext", () => {
  it("should start with UNLOADED status", () => {
    const ctx = new LibraryContext();
    expect(ctx.status).toBe(LibraryStatusEnum.UNLOADED);
  });
});

describe("LibraryHandle", () => {
  it("should expose the symbol", () => {
    const sym = Symbol("test");
    const handle = new LibraryHandle(sym, new TestLibrary(), new LibraryContext());
    expect(handle.symbol).toBe(sym);
  });

  it("should expose the library", () => {
    const lib = new TestLibrary();
    const handle = new LibraryHandle(Symbol("test"), lib, new LibraryContext());
    expect(handle.library).toBe(lib);
  });

  it("should expose the context", () => {
    const ctx = new LibraryContext();
    const handle = new LibraryHandle(Symbol("test"), new TestLibrary(), ctx);
    expect(handle.context).toBe(ctx);
  });
});

describe("BaseLibraryManager", () => {
  let manager: TestableBaseLibraryManager;

  beforeEach(() => {
    manager = new TestableBaseLibraryManager();
  });

  it("should retrieve a library by symbol after setting it", () => {
    const sym = Symbol.for("myLib");
    const lib = new TestLibrary();
    const ctx = new LibraryContext();

    manager.expose_setNewLibrary(Symbol.for("filler"), new TestLibrary(), ctx);
    manager.expose_setNewLibrary(sym, lib, ctx);

    const handle = manager.get(sym);
    expect(handle.library).toBe(lib);
    expect(handle.symbol).toBe(sym);
  });

  it("should throw when getting a library that was not set", () => {
    const sym = Symbol.for("unknown");
    expect(() => manager.get(sym)).toThrow();
  });

  it("should throw when getting a library by unknown index", () => {
    expect(() => (manager as any)._get(99)).toThrow();
  });
});
