import type { ClientRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { EcsLibrary } from "@nanoforge-dev/ecs/client";
import { Circle, Graphics2DLibrary, Layer, Rect } from "@nanoforge-dev/graphics-2d";
import { InputEnum, InputLibrary } from "@nanoforge-dev/input";
import { NetworkPeerLibrary } from "@nanoforge-dev/network/peer";

import { AssignId, Input, Play } from "../../../shared/protocol";
import {
  CircleComponent,
  Controller,
  NetworkId,
  Position,
  RectangleComponent,
  Velocity,
} from "./components/components";
import {
  applyMoves,
  bounce,
  controlPlayer,
  draw,
  handleClientInput,
  handlePlay,
  move,
  onClientDisconnect,
} from "./systems/systems";

export const layer = new Layer();

export const main = async (options: ClientRunOptions): Promise<void> => {
  const app = NanoforgeFactory.createClient({
    tickRate: 60,
    viewport: { width: 1920, height: 1080, fit: "contain" },
  });
  const graphics = new Graphics2DLibrary();
  const ecs = new EcsLibrary();
  const network = new NetworkPeerLibrary();
  const input = new InputLibrary();

  app.use(graphics);
  app.use(ecs);
  app.use(network);
  app.use(input);

  await app.init(options);

  const registry = ecs.registry;

  graphics.stage.add(layer);

  const terrain = registry.spawnEntity();
  registry.addComponent(terrain, new Position(0, 0));
  registry.addComponent(
    terrain,
    new RectangleComponent(new Rect({ fill: "rgb(58,99,39)", width: 1920, height: 1080 })),
  );
  const terrainLine = registry.spawnEntity();
  registry.addComponent(terrainLine, new Position(955, 0));
  registry.addComponent(
    terrainLine,
    new RectangleComponent(new Rect({ fill: "rgb(148,204,117)", width: 10, height: 1080 })),
  );

  // Start positions are the host's: joiners get theirs from its `Move` packets.
  const ball = registry.spawnEntity();
  registry.addComponent(ball, new Velocity(0, 0));
  registry.addComponent(ball, new Position(960, 540));
  registry.addComponent(ball, new CircleComponent(new Circle({ radius: 30, fill: "red" })));

  const me = registry.spawnEntity();
  registry.addComponent(me, new Controller(InputEnum.ArrowUp, InputEnum.ArrowDown));

  const paddle1 = registry.spawnEntity();
  registry.addComponent(paddle1, new Position(20, 390));
  registry.addComponent(paddle1, new Velocity(0, 0));
  registry.addComponent(
    paddle1,
    new RectangleComponent(new Rect({ fill: "blue", width: 30, height: 300 })),
  );

  const paddle2 = registry.spawnEntity();
  registry.addComponent(paddle2, new Position(1850, 390));
  registry.addComponent(paddle2, new Velocity(0, 0));
  registry.addComponent(
    paddle2,
    new RectangleComponent(new Rect({ fill: "blue", width: 30, height: 300 })),
  );

  // Dispatched before the systems, so an entity gets its id before `applyMoves` reads its moves.
  network.packets.on(AssignId, ({ assigned, id }) => {
    const index = { ball: 2, paddle1: 4, paddle2: 5 }[assigned];
    registry.addComponent(registry.entityFromIndex(index), new NetworkId(id));
  });

  // One world for both roles: `move` runs once, `bounce` only does something on the host.
  registry.addSystem(applyMoves);
  registry.addSystem(bounce);
  registry.addSystem(move);
  registry.addSystem(controlPlayer);
  registry.addSystem(draw);

  // `?room=CODE` joins that game; without it, this player hosts one.
  const room = new URLSearchParams(location.search).get("room");
  if (room) {
    await network.join(room);
  } else {
    const server = await network.host();
    console.info(`Invite: ${location.origin}${location.pathname}?room=${network.room}`);

    // [ball, paddle1, paddle2]: the only entities with both components.
    const zip = () => registry.getZipper([Position, Velocity]);
    server.clients.onDisconnect(onClientDisconnect);
    server.packets.on(Play, (_, { clientId }) => handlePlay(clientId, server, zip()));
    server.packets.on(Input, ({ key }, { clientId }) =>
      handleClientInput(clientId, key, server, zip()),
    );
  }

  // On the host, this reaches its own server: the host's player takes paddle 1.
  network.packets.send(Play);

  await app.run();
};
