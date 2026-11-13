import type { ClientRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { EcsLibrary } from "@nanoforge-dev/ecs/client";
import { EditorLibrary } from "@nanoforge-dev/editor-lib";
import { Circle, Graphics2DLibrary, Rect } from "@nanoforge-dev/graphics-2d";
import { InputLibrary } from "@nanoforge-dev/input";

import { Player } from "./components/player.component";
import { movePlayer } from "./systems/move-player.system";

/** Read by the Playwright tests in `e2e/graphics`. */
export interface E2EState {
  tick: number;
  player: { x: number; y: number };
}

export const main = async (options: ClientRunOptions): Promise<void> => {
  const app = NanoforgeFactory.createClient({
    tickRate: 60,
    viewport: { width: 800, height: 600, fit: "contain" },
  });
  const graphics = new Graphics2DLibrary();
  const ecs = new EcsLibrary();
  const input = new InputLibrary();
  app.use(graphics);
  app.use(ecs);
  app.use(input);
  app.use(new EditorLibrary());

  await app.init(options);

  const layer = graphics.baseLayer;
  layer.add(new Rect({ x: 0, y: 0, width: 800, height: 600, fill: "#1e1e2e" }));
  layer.add(new Circle({ x: 600, y: 300, radius: 80, fill: "#00ff00" }));
  const square = new Rect({ x: 100, y: 250, width: 100, height: 100, fill: "#ff0000" });
  layer.add(square);

  const registry = ecs.registry;
  registry.addComponent(registry.spawnEntity(), new Player(square));

  const state: E2EState = { tick: 0, player: { x: square.x(), y: square.y() } };
  (window as unknown as { __e2e: E2EState }).__e2e = state;

  registry.addSystem(movePlayer);

  await app.run();
};
