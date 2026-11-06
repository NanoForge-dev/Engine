import { expect, test } from "@playwright/test";

import type { E2EState } from "../game-2d/apps/client/src/main";
import { expectColor, gameArea, openGame, pixelAt, readState, waitTicks } from "./helpers";

test("boots without errors and keeps ticking", async ({ page }) => {
  const errors = await openGame(page);
  await waitTicks(page, 30);
  await expect(gameArea(page).locator("canvas").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("moves the player while an arrow key is held", async ({ page }) => {
  await openGame(page);
  await waitTicks(page, 1);
  const before = (await readState<E2EState>(page)).player;

  await page.keyboard.down("ArrowRight");
  await waitTicks(page, 10);
  await page.keyboard.up("ArrowRight");
  await waitTicks(page, 2);
  const after = (await readState<E2EState>(page)).player;
  expect(after.x).toBeGreaterThan(before.x);
  expect(after.y).toBe(before.y);

  await waitTicks(page, 10);
  expect((await readState<E2EState>(page)).player).toEqual(after);
});

test("draws the shapes at their positions", async ({ page }) => {
  await openGame(page);
  await waitTicks(page, 5);
  const png = await gameArea(page).screenshot();
  expectColor(await pixelAt(page, png, 20, 20), [0x1e, 0x1e, 0x2e]); // background
  expectColor(await pixelAt(page, png, 150, 300), [0xff, 0x00, 0x00]); // player square
  expectColor(await pixelAt(page, png, 600, 300), [0x00, 0xff, 0x00]); // circle
});

test("matches the reference screenshot", async ({ page }) => {
  await openGame(page);
  await waitTicks(page, 5);
  await expect(gameArea(page)).toHaveScreenshot("scene.png");
});
