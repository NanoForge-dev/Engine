import { type InitContext } from "@nanoforge-dev/common";
import { ConfigRegistry } from "@nanoforge-dev/core/src/config/config-registry";
import { ServerNetworkLibrary } from "@nanoforge-dev/server-network";

const tickLengthMs = 1000 / 60;
let previousTick = Date.now();

const paddle1PosY = { value: 390 };
const paddle1VelY = { value: 0 };
const paddle2PosY = { value: 390 };
const paddle2VelY = { value: 0 };
let cli1 = -1;
let cli2 = -1;
let network: ServerNetworkLibrary | undefined;
const paddleSpeed = 1;

let roundStart = 0;

const ball = {
  position: { x: 960, y: 540 },
  velocity: { x: 0, y: 0 },
};

function sendBall(newCli: number) {
  if (!network || !network.tcp || newCli == -1) return;
  network.tcp.sendToClient(
    newCli,
    new TextEncoder().encode(
      JSON.stringify({
        type: "move",
        id: 0,
        position: ball.position,
        velocity: ball.velocity,
      }),
    ),
  );
}

function connectNewClient(newCli: number) {
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
  sendBall(newCli);
  network.tcp.sendToClient(
    newCli,
    new TextEncoder().encode(
      JSON.stringify({
        type: "move",
        id: 1,
        position: { x: 20, y: paddle1PosY.value },
        velocity: { x: 0, y: 0 },
      }),
    ),
  );
  network.tcp.sendToClient(
    newCli,
    new TextEncoder().encode(
      JSON.stringify({
        type: "move",
        id: 2,
        position: { x: 1850, y: paddle2PosY.value },
        velocity: { x: 0, y: 0 },
      }),
    ),
  );
}

function handleClientInput(clientId: number, key: string) {
  let velPtr: { value: number } | null = null;
  let id = 0;
  let posx = 0;
  let posy = 0;

  if (clientId === cli1) {
    velPtr = paddle1VelY;
    id = 1;
    posx = 20;
    posy = paddle1PosY.value;
  } else if (clientId === cli2) {
    velPtr = paddle2VelY;
    id = 2;
    posx = 1850;
    posy = paddle2PosY.value;
  } else {
    return;
  }

  if (key === "up") {
    velPtr.value = -paddleSpeed;
  }
  if (key === "down") {
    velPtr.value = paddleSpeed;
  }
  if (key === "stop") {
    velPtr.value = 0;
  }
  network?.tcp?.sendToEverybody(
    new TextEncoder().encode(
      JSON.stringify({
        type: "move",
        id: id,
        position: { x: posx, y: posy },
        velocity: { x: 0, y: velPtr.value },
      }),
    ),
  );
}

function handlePackets() {
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
        connectNewClient(newCli);
      } else if (data.type == "input") {
        handleClientInput(client, data.key);
      }
    });
  });
}

const move = (delta: number) => {
  paddle1PosY.value += paddle1VelY.value * delta;
  paddle2PosY.value += paddle2VelY.value * delta;
  ball.position.x += ball.velocity.x * delta;
  ball.position.y += ball.velocity.y * delta;
};

const bounce = (delta: number) => {
  if (roundStart < 3000 && roundStart != -1) {
    roundStart += delta;
    return;
  }
  if (roundStart >= 3000) {
    roundStart = -1;
    ball.velocity.x = 1;
    sendBall(cli1);
    sendBall(cli2);
    return;
  }
  let bounced = false;
  if (ball.position.y <= 0 || ball.position.y >= 1080) {
    ball.velocity.y *= -1;
    bounced = true;
  }
  if (
    (ball.position.x <= 65 &&
      paddle1PosY.value - 15 <= ball.position.y &&
      ball.position.y - 15 <= paddle1PosY.value + 300) ||
    (ball.position.x >= 1835 &&
      paddle2PosY.value - 15 <= ball.position.y &&
      ball.position.y - 15 <= paddle2PosY.value + 300)
  ) {
    const prevSpeed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2);
    const newSpeed = prevSpeed * 1.1;
    const posOnPaddle =
      (ball.position.y - (ball.position.x < 960 ? paddle1PosY.value : paddle2PosY.value) + 15) /
      330;
    const baseAngle = posOnPaddle * ((6 * Math.PI) / 8) + Math.PI / 8 - Math.PI / 2;
    const outAngle = ball.position.x < 960 ? baseAngle : -baseAngle + Math.PI;
    ball.velocity.x = Math.cos(outAngle) * newSpeed;
    ball.velocity.y = Math.sin(outAngle) * newSpeed;
    bounced = true;
  } else if (ball.position.x <= 15 || ball.position.x >= 1905) {
    ball.position = { x: 960, y: 540 };
    ball.velocity = { x: 0, y: 0 };
    roundStart = 0;
    bounced = true;
  }
  if (bounced) {
    sendBall(cli1);
    sendBall(cli2);
  }
};

const update = (delta: number) => {
  handlePackets();
  bounce(delta);
  move(delta);
};

const gameLoop = () => {
  const tickStart = Date.now();
  update(tickStart - previousTick);

  previousTick = tickStart;
  setTimeout(gameLoop, tickLengthMs + tickStart - Date.now());
};

export const main = async () => {
  network = new ServerNetworkLibrary();

  await network.__init({
    config: new ConfigRegistry({ listeningTcpPort: "4445", listeningUdpPort: "4444" }),
  } as unknown as InitContext);
  gameLoop();
};

main();
