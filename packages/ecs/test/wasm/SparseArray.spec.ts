import { describe, expect, it } from "vitest";

import Module from "../../lib/libecs.js";

describe("SparseArray", () => {
  it("basic instantation", async () => {
    const m = await Module();
    const sa = new m.SparseArray();
    expect(sa).toBeDefined();
    expect(sa.size()).toBe(0);
  });

  it("basic insert", async () => {
    const m = await Module();
    const sa = new m.SparseArray();
    sa.set(0, 1);
    expect(sa.size()).toBe(1);
    expect(sa.get(0)).toBe(1);
  });

  it("basic remove", async () => {
    const m = await Module();
    const sa = new m.SparseArray();
    sa.set(0, 1);
    sa.erase(0);
    expect(sa.size()).toBe(1);
    expect(sa.get(0)).toBe(undefined);
  });

  it("basic iteration with get and size", async () => {
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
});
