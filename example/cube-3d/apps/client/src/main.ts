import type { ClientRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { EcsLibrary } from "@nanoforge-dev/ecs/client";
import { Graphics3DLibrary } from "@nanoforge-dev/graphics-3d";
import {
  BoxGeometry,
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
} from "@nanoforge-dev/graphics-3d/three";

import { Model, Spin } from "./components/components";
import { spin } from "./systems/systems";

export const main = async (options: ClientRunOptions): Promise<void> => {
  // 1. Create the app and register the libraries it uses.
  const app = NanoforgeFactory.createClient({
    tickRate: 60,
    viewport: { width: 1920, height: 1080, fit: "contain" },
  });
  const graphics = new Graphics3DLibrary();
  const ecs = new EcsLibrary();
  app.use(graphics);
  app.use(ecs);

  await app.init(options);

  // 2. Set up the scene: a background, a camera looking at the origin, and lights.
  const { scene, camera } = graphics;
  scene.background = new Color("#20232a");
  camera.position.set(0, 1.5, 4);
  camera.lookAt(0, 0, 0);

  const sun = new DirectionalLight("white", 3);
  sun.position.set(3, 5, 4);
  scene.add(new HemisphereLight("white", "#445566", 1), sun);

  // 3. Add a cube to the scene, and an entity that spins it.
  const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial({ color: "#44aa88" }));
  scene.add(mesh);

  const registry = ecs.registry;
  const cube = registry.spawnEntity();
  registry.addComponent(cube, new Model(mesh));
  registry.addComponent(cube, new Spin(20, 90, 0));

  // 4. Run the systems every tick. graphics-3d renders the scene after them.
  registry.addSystem(spin);

  await app.run();
};
