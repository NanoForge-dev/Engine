import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-server";
import { type NetworkServerLibrary } from "@nanoforge-dev/network-server";

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

function sendMoveAll(id: number, vel: Velocity, pos: Position, network: NetworkServerLibrary) {
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

function connectNewClient(newCli: number, network: NetworkServerLibrary, zip: any) {
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
  sendMoveAll(0, zip[0].Velocity, zip[0].Position, network);
  sendMoveAll(1, zip[1].Velocity, zip[1].Position, network);
  sendMoveAll(2, zip[2].Velocity, zip[2].Position, network);
}

function handleClientInput(clientId: number, key: string, network: NetworkServerLibrary, zip: any) {
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
    paddle.Velocity.y = -paddleSpeed;
    if (paddle.Position.y < 0) {
      paddle.Position.y = 0;
      paddle.Velocity.y = 0;
    }
  }
  if (key === "down") {
    paddle.Velocity.y = paddleSpeed;
    if (paddle.Position.y > 780) {
      paddle.Position.y = 780;
      paddle.Velocity.y = 0;
    }
  }
  if (key === "stop") {
    paddle.Velocity.y = 0;
  }
  sendMoveAll(id, paddle.Velocity, paddle.Position, network);
}

export function packetHandler(registry: Registry, ctx: Context) {
  const zip = registry.getZipper([Position, Velocity]);
  const network = ctx.libs.getNetwork<NetworkServerLibrary>();

  if (network.tcp.getConnectedClients().indexOf(cli1) == -1) cli1 = -1;
  if (network.tcp.getConnectedClients().indexOf(cli2) == -1) cli2 = -1;
  const clientPackets: Map<number, Uint8Array[]> = network.tcp.getReceivedPackets();
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
        }
        connectNewClient(newCli, network, zip);
      } else if (data.type == "input") {
        handleClientInput(client, data.key, network, zip);
      }
    });
  });
}

function checkOutOfTerrain(id: number, paddle: any, network: NetworkServerLibrary) {
  if (paddle.Position.y < 0) {
    paddle.Position.y = 0;
    paddle.Velocity.y = 0;
    sendMoveAll(id, paddle.Velocity, paddle.Position, network);
  }
  if (paddle.Position.y > 780) {
    paddle.Position.y = 780;
    paddle.Velocity.y = 0;
    sendMoveAll(id, paddle.Velocity, paddle.Position, network);
  }
}

export const bounce = (registry: Registry, ctx: Context) => {
  const network = ctx.libs.getNetwork<NetworkServerLibrary>();
  const zip = registry.getZipper([Position, Velocity]);
  checkOutOfTerrain(1, zip[1], network);
  checkOutOfTerrain(2, zip[2], network);
  if (roundStart < 3000 && roundStart != -1) {
    roundStart += ctx.app.delta;
    return;
  }
  if (roundStart >= 3000) {
    roundStart = -1;
    zip[0].Velocity.x = 1;
    sendMoveAll(0, zip[0].Velocity, zip[0].Position, network);
    return;
  }
  let bounced = false;
  if (zip[0].Position.y <= 0 || zip[0].Position.y >= 1080) {
    zip[0].Velocity.y *= -1;
    bounced = true;
  }
  if (
    (zip[0].Position.x <= 65 &&
      zip[1].Position.y - 15 <= zip[0].Position.y &&
      zip[0].Position.y - 15 <= zip[1].Position.y + 300) ||
    (zip[0].Position.x >= 1835 &&
      zip[2].Position.y - 15 <= zip[0].Position.y &&
      zip[0].Position.y - 15 <= zip[2].Position.y + 300)
  ) {
    let paddleTouched = 1;
    if (zip[0].Position.x >= 1835) {
      paddleTouched = 2;
    }
    const prevSpeed = Math.sqrt(zip[0].Velocity.x ** 2 + zip[0].Velocity.y ** 2);
    const newSpeed = prevSpeed * 1.1;
    const posOnPaddle =
      (zip[0].Position.y -
        (zip[0].Position.x < 960 ? zip[paddleTouched].Position.y : zip[paddleTouched].Position.y) +
        15) /
      330;
    const baseAngle = posOnPaddle * ((6 * Math.PI) / 8) + Math.PI / 8 - Math.PI / 2;
    const outAngle = zip[0].Position.x < 960 ? baseAngle : -baseAngle + Math.PI;
    zip[0].Velocity.x = Math.cos(outAngle) * newSpeed;
    zip[0].Velocity.y = Math.sin(outAngle) * newSpeed;
    bounced = true;
  } else if (zip[0].Position.x <= 15 || zip[0].Position.x >= 1905) {
    zip[0].Position.x = 960;
    zip[0].Position.y = 540;
    zip[0].Velocity.x = 0;
    zip[0].Velocity.y = 0;
    roundStart = 0;
    bounced = true;
  }
  if (bounced) {
    sendMoveAll(0, zip[0].Velocity, zip[0].Position, network);
  }
};
