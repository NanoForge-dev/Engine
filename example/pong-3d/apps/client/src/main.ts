import type { ClientRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { EcsLibrary } from "@nanoforge-dev/ecs/client";
import { Graphics3DLibrary } from "@nanoforge-dev/graphics-3d";
import { InputEnum, InputLibrary } from "@nanoforge-dev/input";
import { ControllerLibrary } from "@nanoforge-dev/input/controller";
import { NetworkClientLibrary } from "@nanoforge-dev/network/client";

import { AssignId, PADDLE, Play, Seat } from "../../../shared/protocol";
import { BALL_RADIUS, buildArena, createBall, createPaddle } from "./arena";
import { CameraRig, Model, NetworkId, Player, Position, Velocity } from "./components/components";
import { applyMoves, controlPlayer, draw, followCamera, move } from "./systems/systems";

export const main = async (options: ClientRunOptions): Promise<void> => {
  const app = NanoforgeFactory.createClient({
    tickRate: 60,
    viewport: { width: 1920, height: 1080, fit: "contain" },
  });
  const graphics = new Graphics3DLibrary();
  const ecs = new EcsLibrary();
  const network = new NetworkClientLibrary();
  const input = new InputLibrary();
  const controller = new ControllerLibrary();

  app.use(graphics);
  app.use(ecs);
  app.use(network);
  app.use(input);
  app.use(controller);

  await app.init(options);

  graphics.renderer.shadowMap.enabled = true;
  buildArena(graphics.scene);

  const registry = ecs.registry;

  const spawnModel = (model: Model) => {
    const entity = registry.spawnEntity();
    registry.addComponent(entity, new Position());
    registry.addComponent(entity, new Velocity());
    registry.addComponent(entity, model);
    graphics.scene.add(model.object);
    return entity;
  };

  const ball = createBall();
  ball.position.y = BALL_RADIUS;
  const paddle1 = createPaddle("#4d8dff");
  const paddle2 = createPaddle("#ff9f40");
  paddle1.position.y = paddle2.position.y = 0.2;

  // The server sends each entity's network id once we joined; game state follows in `Move` packets.
  const entities = {
    ball: spawnModel(new Model(ball)),
    paddle1: spawnModel(new Model(paddle1, PADDLE.width / 2, PADDLE.height / 2)),
    paddle2: spawnModel(new Model(paddle2, PADDLE.width / 2, PADDLE.height / 2)),
  };

  const me = registry.spawnEntity();
  registry.addComponent(
    me,
    new Player([InputEnum.ArrowLeft, InputEnum.KeyA], [InputEnum.ArrowRight, InputEnum.KeyD]),
  );
  registry.addComponent(me, new CameraRig());

  // Dispatched before the systems, so an entity gets its id before `applyMoves` reads its moves.
  network.packets.on(AssignId, ({ assigned, id }) => {
    registry.addComponent(entities[assigned], new NetworkId(id));
  });
  network.packets.on(Seat, ({ paddle }) => {
    registry.getZipper([Player]).forEach(({ Player }) => (Player.seat = paddle));
    console.info(paddle === 0 ? "Spectating" : `Playing paddle ${paddle}`);
  });

  registry.addSystem(applyMoves);
  registry.addSystem(move);
  registry.addSystem(controlPlayer);
  registry.addSystem(draw);
  registry.addSystem(followCamera);

  network.packets.send(Play);

  await app.run();
};
