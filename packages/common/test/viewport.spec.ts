import { describe, expect, it } from "vitest";

import { computeViewport } from "../src";

describe("computeViewport", () => {
  describe("without a design resolution", () => {
    it("should default to a 1920x1080 design resolution in contain mode", () => {
      const state = computeViewport(1920, 1080);
      expect(state).toMatchObject({
        designWidth: 1920,
        designHeight: 1080,
        fit: "contain",
        scaleX: 1,
        scaleY: 1,
        visibleWidth: 1920,
        visibleHeight: 1080,
        contentLeft: 0,
        contentTop: 0,
        originX: 0,
        originY: 0,
      });
    });

    it("should scale the default design resolution to the container", () => {
      const state = computeViewport(2560, 1440);
      expect(state.scaleX).toBeCloseTo(4 / 3);
      expect(state.scaleY).toBeCloseTo(4 / 3);
    });

    it("should report the given pixel ratio", () => {
      expect(computeViewport(800, 600, {}, 2).pixelRatio).toBe(2);
    });
  });

  describe("same aspect ratio (1920x1080 design in 2560x1440)", () => {
    it.each(["fill", "contain", "cover"] as const)(
      "should scale by 4/3 with no offset in %s mode",
      (fit) => {
        const state = computeViewport(2560, 1440, { width: 1920, height: 1080, fit });
        expect(state.scaleX).toBeCloseTo(4 / 3);
        expect(state.scaleY).toBeCloseTo(4 / 3);
        expect(state.visibleWidth).toBeCloseTo(2560);
        expect(state.visibleHeight).toBeCloseTo(1440);
        expect(state.contentLeft + state.contentTop + state.originX + state.originY).toBeCloseTo(0);
        expect(100 * state.scaleX).toBeCloseTo(133.33, 2);
        expect(100 * state.scaleY).toBeCloseTo(133.33, 2);
      },
    );
  });

  describe("different aspect ratio (1920x1080 design in 1000x1000)", () => {
    const design = { width: 1920, height: 1080 };

    it("should default to contain", () => {
      expect(computeViewport(1000, 1000, design).fit).toBe("contain");
    });

    it("contain: should scale on the limiting side and letterbox vertically", () => {
      const state = computeViewport(1000, 1000, { ...design, fit: "contain" });
      const scale = 1000 / 1920;
      expect(state.scaleX).toBeCloseTo(scale);
      expect(state.scaleY).toBeCloseTo(scale);
      expect(state.visibleWidth).toBeCloseTo(1000);
      expect(state.visibleHeight).toBeCloseTo(1080 * scale);
      expect(state.contentLeft).toBeCloseTo(0);
      expect(state.contentTop).toBeCloseTo((1000 - 1080 * scale) / 2);
      expect(state.originX).toBeCloseTo(0);
      expect(state.originY).toBeCloseTo(0);
    });

    it("cover: should scale on the other side and crop horizontally", () => {
      const state = computeViewport(1000, 1000, { ...design, fit: "cover" });
      const scale = 1000 / 1080;
      expect(state.scaleX).toBeCloseTo(scale);
      expect(state.scaleY).toBeCloseTo(scale);
      expect(state.visibleWidth).toBeCloseTo(1000);
      expect(state.visibleHeight).toBeCloseTo(1000);
      expect(state.contentLeft).toBeCloseTo(0);
      expect(state.contentTop).toBeCloseTo(0);
      expect(state.originX).toBeCloseTo((1000 - 1920 * scale) / 2);
      expect(state.originX).toBeLessThan(0);
      expect(state.originY).toBeCloseTo(0);
    });

    it("fill: should stretch each axis independently", () => {
      const state = computeViewport(1000, 1000, { ...design, fit: "fill" });
      expect(state.scaleX).toBeCloseTo(1000 / 1920);
      expect(state.scaleY).toBeCloseTo(1000 / 1080);
      expect(state.visibleWidth).toBeCloseTo(1000);
      expect(state.visibleHeight).toBeCloseTo(1000);
      expect(state.contentLeft + state.contentTop + state.originX + state.originY).toBeCloseTo(0);
    });
  });
});
