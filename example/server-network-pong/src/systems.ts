import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs";
import { type ServerNetworkLibrary } from "@nanoforge-dev/server-network";

import { Position, Velocity } from "./components";

let cli1 = -1;
let cli2 = -1;
const paddleSpeed = 1;

let roundStart = 0;

export function move(registry: Registry, ctx: Context) {
  const entities = registry.getZipper([Position, Velocity]);

  entities.forEach(({ Position, Velocity }) => {
    Position.x += Velocity.x * ctx.app.delta;
    Position.y += Velocity.y * ctx.app.delta;
  });
}

function sendMoveAll(id: number, vel: Velocity, pos: Position, network: ServerNetworkLibrary) {
  if (!network || !network.tcp) return;
  network.tcp.sendToEverybody(
    new TextEncoder().encode(
      JSON.stringify({
        type: "move",
        id: id,
        position: { x: pos.x, y: pos.y },
        velocity: { x: vel.x, y: vel.y },
      }),
    ),
  );
}

function connectNewClient(newCli: number, network: ServerNetworkLibrary, zip: any) {
  if (!network || !network.tcp) return;
  network.tcp.sendToClient(
    newCli,
    new TextEncoder().encode(JSON.stringify({ type: "assignId", assigned: "ball", id: 0 })),
  );
  network.tcp.sendToClient(
    newCli,
    new TextEncoder().encode(JSON.stringify({ type: "assignId", assigned: "paddle1", id: 1 })),
  );
  network.tcp.sendToClient(
    newCli,
    new TextEncoder().encode(JSON.stringify({ type: "assignId", assigned: "paddle2", id: 2 })),
  );
  sendMoveAll(0, zip[0].velocity, zip[0].position, network);
  sendMoveAll(1, zip[1].velocity, zip[1].position, network);
  sendMoveAll(2, zip[2].velocity, zip[2].position, network);
}

function handleClientInput(clientId: number, key: string, network: ServerNetworkLibrary, zip: any) {
  let id = 0;

  if (clientId === cli1) {
    id = 1;
  } else if (clientId === cli2) {
    id = 2;
  } else {
    return;
  }
  const paddle = zip[id];

  if (key === "up") {
    paddle.velocity.y = -paddleSpeed;
  }
  if (key === "down") {
    paddle.velocity.y = paddleSpeed;
  }
  if (key === "stop") {
    paddle.velocity.y = 0;
  }
  sendMoveAll(id, paddle.velocity, paddle.position, network);
}

export function packetHandler(registry: Registry, ctx: Context) {
  const zip = registry.getZipper([Position, Velocity]);
  const network: ServerNetworkLibrary = ctx.libs.getNetwork<ServerNetworkLibrary>();
  if (!network || !network.tcp) return;
  if (network.tcp.getConnectedClients().indexOf(cli1) == -1) cli1 = -1;
  if (network.tcp.getConnectedClients().indexOf(cli2) == -1) cli2 = -1;
  const clientPackets = network.tcp.getReceivedPackets();
  clientPackets.forEach((packets, client) => {
    packets.forEach((packet) => {
      const data = JSON.parse(new TextDecoder().decode(packet));
      if (data.type == "play") {
        let newCli = -1;
        if (client == cli1 || client == cli2) return;
        if (cli1 == -1) {
          cli1 = client;
          newCli = client;
        } else if (cli2 == -1) {
          cli2 = client;
          newCli = client;
        } else {
          return;
        }
        connectNewClient(newCli, network, zip);
      } else if (data.type == "input") {
        handleClientInput(client, data.key, network, zip);
      }
    });
  });
}

export const bounce = (registry: Registry, ctx: Context) => {
  const network = ctx.libs.getNetwork<ServerNetworkLibrary>();
  if (roundStart < 3000 && roundStart != -1) {
    roundStart += ctx.app.delta;
    return;
  }
  const zip = registry.getZipper([Position, Velocity]);
  if (roundStart >= 3000) {
    roundStart = -1;
    zip[0].velocity.x = 1;
    sendMoveAll(0, zip[0].velocity, zip[0].position, network);
    sendMoveAll(0, zip[0].velocity, zip[0].position, network);
    return;
  }
  let bounced = false;
  if (zip[0].position.y <= 0 || zip[0].position.y >= 1080) {
    zip[0].velocity.y *= -1;
    bounced = true;
  }
  if (
    (zip[0].position.x <= 65 &&
      zip[1].position.y - 15 <= zip[0].position.y &&
      zip[0].position.y - 15 <= zip[1].position.y + 300) ||
    (zip[0].position.x >= 1835 &&
      zip[1].position.y - 15 <= zip[0].position.y &&
      zip[0].position.y - 15 <= zip[1].position.y + 300)
  ) {
    const prevSpeed = Math.sqrt(zip[0].velocity.x ** 2 + zip[0].velocity.y ** 2);
    const newSpeed = prevSpeed * 1.1;
    const posOnPaddle =
      (zip[0].position.y - (zip[0].position.x < 960 ? zip[1].position.y : zip[1].position.y) + 15) /
      330;
    const baseAngle = posOnPaddle * ((6 * Math.PI) / 8) + Math.PI / 8 - Math.PI / 2;
    const outAngle = zip[0].position.x < 960 ? baseAngle : -baseAngle + Math.PI;
    zip[0].velocity.x = Math.cos(outAngle) * newSpeed;
    zip[0].velocity.y = Math.sin(outAngle) * newSpeed;
    bounced = true;
  } else if (zip[0].position.x <= 15 || zip[0].position.x >= 1905) {
    zip[0].position = { x: 960, y: 540 };
    zip[0].velocity = { x: 0, y: 0 };
    roundStart = 0;
    bounced = true;
  }
  if (bounced) {
    sendMoveAll(0, zip[0].velocity, zip[0].position, network);
    sendMoveAll(0, zip[0].velocity, zip[0].position, network);
  }
};
