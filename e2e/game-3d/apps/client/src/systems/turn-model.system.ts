import type { Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs/client";
import { InputEnum } from "@nanoforge-dev/input";

import { Model } from "../components/model.component";
import type { E2EState } from "../main";

// Fixed step per tick, not per second: screenshots and rotations must not depend on frame timing.
const TURN = 0.05;

/**
 * Turns the `Model` object around its Y axis while an arrow key is held, and reports its rotation
 * and the tick count in `window.__e2e` for the Playwright tests.
 *
 * @system
 * @side client
 */
export const turnModel = (registry: Registry, ctx: Context) => {
  const state = (window as unknown as { __e2e: E2EState }).__e2e;
  registry.getZipper([Model]).forEach(({ Model }) => {
    const turn =
      (ctx.input.isKeyPressed(InputEnum.ArrowRight) ? TURN : 0) -
      (ctx.input.isKeyPressed(InputEnum.ArrowLeft) ? TURN : 0);
    Model.object.rotation.y += turn;
    state.cube = { rotationY: Model.object.rotation.y };
  });
  state.tick++;
};
