import type { Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs/client";
import { InputEnum } from "@nanoforge-dev/input";

import { Player } from "../components/player.component";
import type { E2EState } from "../main";

// Fixed step per tick, not per second: screenshots and positions must not depend on frame timing.
const SPEED = 5;

/**
 * Moves the `Player` square horizontally while an arrow key is held, and reports its position and
 * the tick count in `window.__e2e` for the Playwright tests.
 *
 * @system
 * @side client
 */
export const movePlayer = (registry: Registry, ctx: Context) => {
  const state = (window as unknown as { __e2e: E2EState }).__e2e;
  registry.getZipper([Player]).forEach(({ Player }) => {
    const dx =
      (ctx.input.isKeyPressed(InputEnum.ArrowRight) ? SPEED : 0) -
      (ctx.input.isKeyPressed(InputEnum.ArrowLeft) ? SPEED : 0);
    Player.shape.x(Player.shape.x() + dx);
    state.player = { x: Player.shape.x(), y: Player.shape.y() };
  });
  state.tick++;
};
