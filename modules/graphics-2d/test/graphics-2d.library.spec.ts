import type { InitContext } from "@nanoforge-dev/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Graphics2DLibrary } from "../src";

const makeInitContext = (container: HTMLDivElement | null | undefined): InitContext =>
  ({
    vars: { get: () => undefined, set: () => {} },
    env: {},
    files: new Map(),
    container,
  }) as InitContext;

describe("Graphics2DLibrary", () => {
  describe("metadata", () => {
    it("should expose the reserved 'graphics' key", () => {
      expect(new Graphics2DLibrary().key).toBe("graphics");
    });
  });

  describe("before initialization", () => {
    let library: Graphics2DLibrary;

    beforeEach(() => {
      library = new Graphics2DLibrary();
    });

    it("should throw when stage is accessed before __init", () => {
      expect(() => library.stage).toThrow();
    });

    it("should throw when baseLayer is accessed before __init", () => {
      expect(() => library.baseLayer).toThrow();
    });

    it("should throw when __init is called without a container", async () => {
      await expect(library.__init(makeInitContext(null))).rejects.toThrow();
      await expect(library.__init(makeInitContext(undefined))).rejects.toThrow();
    });
  });

  describe("__clear", () => {
    beforeEach(() => {
      vi.stubGlobal("window", {});
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("does not throw when called before __init", async () => {
      await expect(new Graphics2DLibrary().__clear()).resolves.toBeUndefined();
    });
  });

  describe("expose", () => {
    it("throws through to the same not-initialized guard as the instance getters", () => {
      const library = new Graphics2DLibrary();
      expect(() => library.expose().stage).toThrow();
      expect(() => library.expose().baseLayer).toThrow();
    });
  });
});
