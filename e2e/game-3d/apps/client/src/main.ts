import type { ClientRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { EcsLibrary } from "@nanoforge-dev/ecs/client";
import { EditorLibrary } from "@nanoforge-dev/editor-lib";
import { type Graphics3DBackend, Graphics3DLibrary } from "@nanoforge-dev/graphics-3d";
import {
  BoxGeometry,
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
} from "@nanoforge-dev/graphics-3d/three";
import { InputLibrary } from "@nanoforge-dev/input";

import { Model } from "./components/model.component";
import { turnModel } from "./systems/turn-model.system";

/** Read by the Playwright tests in `e2e/graphics`. */
export interface E2EState {
  tick: number;
  backend: Graphics3DBackend;
  cube: { rotationY: number };
}

export const main = async (options: ClientRunOptions): Promise<void> => {
  const app = NanoforgeFactory.createClient({
    tickRate: 60,
    viewport: { width: 800, height: 600, fit: "contain" },
  });
  // CI browsers have no GPU: WebGL2 runs on SwiftShader there, WebGPU does not run reliably.
  const graphics = new Graphics3DLibrary({ forceWebGL: true });
  const ecs = new EcsLibrary();
  const input = new InputLibrary();
  app.use(graphics);
  app.use(ecs);
  app.use(input);
  app.use(new EditorLibrary());

  await app.init(options);

  const { scene, camera } = graphics;
  scene.background = new Color("#20232a");
  camera.position.set(0, 1.5, 4);
  camera.lookAt(0, 0, 0);

  const sun = new DirectionalLight("white", 3);
  sun.position.set(3, 5, 4);
  scene.add(new HemisphereLight("white", "#445566", 1), sun);

  const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial({ color: "#44aa88" }));
  mesh.rotation.set(0.4, 0.6, 0);
  scene.add(mesh);

  const registry = ecs.registry;
  registry.addComponent(registry.spawnEntity(), new Model(mesh));

  const state: E2EState = {
    tick: 0,
    backend: graphics.backend,
    cube: { rotationY: mesh.rotation.y },
  };
  (window as unknown as { __e2e: E2EState }).__e2e = state;

  registry.addSystem(turnModel);

  await app.run();
};
