import { expect, test } from "@playwright/test";

import type { E2EState } from "../game-3d/apps/client/src/main";
import { expectColor, gameArea, openGame, pixelAt, readState, waitTicks } from "./helpers";

test("boots on WebGL without errors and keeps ticking", async ({ page }) => {
  const errors = await openGame(page);
  await waitTicks(page, 30);
  await expect(gameArea(page).locator("canvas")).toBeVisible();
  expect((await readState<E2EState>(page)).backend).toBe("webgl");
  expect(errors).toEqual([]);
});

test("turns the cube while an arrow key is held", async ({ page }) => {
  await openGame(page);
  await waitTicks(page, 1);
  const before = (await readState<E2EState>(page)).cube.rotationY;

  await page.keyboard.down("ArrowRight");
  await waitTicks(page, 10);
  await page.keyboard.up("ArrowRight");
  await waitTicks(page, 2);
  const after = (await readState<E2EState>(page)).cube.rotationY;
  expect(after).toBeGreaterThan(before);

  await waitTicks(page, 10);
  expect((await readState<E2EState>(page)).cube.rotationY).toBe(after);
});

test("draws the cube over the background", async ({ page }) => {
  await openGame(page);
  await waitTicks(page, 5);
  const png = await gameArea(page).screenshot();
  expectColor(await pixelAt(page, png, 20, 20), [0x20, 0x23, 0x2a]); // background
  const [r, g, b] = await pixelAt(page, png, 400, 300); // lit cube: exact shade depends on lighting
  expect(g!).toBeGreaterThan(r! + 40);
  expect(g!).toBeGreaterThan(b!);
});

test("matches the reference screenshot", async ({ page }) => {
  await openGame(page);
  await waitTicks(page, 5);
  await expect(gameArea(page)).toHaveScreenshot("scene.png");
});
