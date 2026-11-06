import { type Page, expect } from "@playwright/test";

import type { E2EState as State2D } from "../game-2d/apps/client/src/main";
import type { E2EState as State3D } from "../game-3d/apps/client/src/main";

type E2EState = State2D | State3D;

declare global {
  interface Window {
    /** Set by the test games' `main`, updated every tick. */
    __e2e?: E2EState;
  }
}

/**
 * Opens the game and waits until the loader screen fades out, so the game is what the player sees.
 * Returns the page errors and console errors collected for the smoke checks.
 */
export const openGame = async (page: Page): Promise<string[]> => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(page.locator("#nanoforge-loader")).toBeHidden();
  return errors;
};

export const readState = <T extends E2EState>(page: Page): Promise<T> =>
  page.evaluate(() => window.__e2e as T);

/** Waits until the game has run `ticks` more ticks than when called. */
export const waitTicks = async (page: Page, ticks: number): Promise<void> => {
  await page.waitForFunction(() => window.__e2e !== undefined);
  const { tick } = await readState(page);
  await page.waitForFunction((target) => window.__e2e!.tick >= target, tick + ticks);
};

/** The game area as the browser composites it: what a player sees. */
export const gameArea = (page: Page) => page.locator("#nanoforge-container");

/** Reads an RGB pixel from a screenshot by decoding it in the page: no PNG library needed. */
export const pixelAt = (page: Page, png: Buffer, x: number, y: number): Promise<number[]> =>
  page.evaluate(
    async ({ src, x, y }) => {
      const image = new Image();
      image.src = src;
      await image.decode();
      const canvas = new OffscreenCanvas(image.width, image.height);
      const context = canvas.getContext("2d")!;
      context.drawImage(image, 0, 0);
      return Array.from(context.getImageData(x, y, 1, 1).data.slice(0, 3));
    },
    { src: `data:image/png;base64,${png.toString("base64")}`, x, y },
  );

export const expectColor = (actual: number[], expected: number[], tolerance = 8): void => {
  for (const [i, channel] of expected.entries())
    expect(
      Math.abs(actual[i]! - channel),
      `channel ${i} of ${actual} vs ${expected}`,
    ).toBeLessThanOrEqual(tolerance);
};
