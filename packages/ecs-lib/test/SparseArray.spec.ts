import { describe, expect, it } from "vitest";

import Module from "../lib/libecs";

describe("SparseArray", () => {
  describe("instantiation", () => {
    it("should create an empty sparse array with size 0", async () => {
      const m = await Module();
      const sa = new m.SparseArray();
      expect(sa).toBeDefined();
      expect(sa.size()).toBe(0);
    });
  });

  describe("set and get", () => {
    it("should insert a value at index 0 and retrieve it", async () => {
      const m = await Module();
      const sa = new m.SparseArray();
      sa.set(0, 1);
      expect(sa.size()).toBe(1);
      expect(sa.get(0)).toBe(1);
    });

    it("should override an existing value at the same index", async () => {
      const m = await Module();
      const sa = new m.SparseArray();
      sa.set(0, 42);
      sa.set(0, 99);
      expect(sa.get(0)).toBe(99);
    });

    it("should store multiple values at different indices", async () => {
      const m = await Module();
      const sa = new m.SparseArray();
      sa.set(0, 10);
      sa.set(2, 20);
      sa.set(4, 30);
      expect(sa.get(0)).toBe(10);
      expect(sa.get(2)).toBe(20);
      expect(sa.get(4)).toBe(30);
    });
  });

  describe("erase", () => {
    it("should erase a value and return undefined at that index", async () => {
      const m = await Module();
      const sa = new m.SparseArray();
      sa.set(0, 1);
      sa.erase(0);
      expect(sa.size()).toBe(1);
      expect(sa.get(0)).toBeUndefined();
    });

    it("should only erase the targeted index", async () => {
      const m = await Module();
      const sa = new m.SparseArray();
      sa.set(0, 1);
      sa.set(1, 2);
      sa.erase(0);
      expect(sa.get(0)).toBeUndefined();
      expect(sa.get(1)).toBe(2);
    });
  });

  describe("iteration", () => {
    it("should sum all values via get and size", async () => {
      const m = await Module();
      const sa = new m.SparseArray();
      sa.set(0, 1);
      sa.set(1, 2);
      sa.set(2, 3);
      let sum = 0;
      for (let i = 0; i < sa.size(); i++) {
        sum += sa.get(i);
      }
      expect(sum).toBe(6);
    });

    it("should skip erased entries during iteration", async () => {
      const m = await Module();
      const sa = new m.SparseArray();
      sa.set(0, 10);
      sa.set(1, 20);
      sa.set(2, 30);
      sa.erase(1);
      let sum = 0;
      for (let i = 0; i < sa.size(); i++) {
        const val = sa.get(i);
        if (val !== undefined) sum += val;
      }
      expect(sum).toBe(40);
    });
  });
});
