import { type NetworkClientLibrary } from "@nanoforge-dev/network-client";
import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";
import { type InputLibrary } from "@nanoforge-dev/input";

import {
  CircleComponent,
  Controller,
  NetworkId,
  Position,
  RectangleComponent,
  Velocity,
} from "./components";

export function move(registry: Registry, ctx: Context) {
  const entities = registry.getZipper([Position, Velocity]);

  entities.forEach(({ Position, Velocity }) => {
    Position.x += Velocity.x * ctx.app.delta;
    Position.y += Velocity.y * ctx.app.delta;
  });
}

export const controlPlayer = (registry: Registry, ctx: Context) => {
  const entities = registry.getZipper([Controller]);
  const input = ctx.libs.getInput<InputLibrary>();
  const network = ctx.libs.getNetwork<NetworkClientLibrary>();

  entities.forEach(({ Controller }) => {
    const upPressed = input.isKeyPressed(Controller.up);
    const downPressed = input.isKeyPressed(Controller.down);
    if (upPressed == downPressed) {
      if (Controller.lastPressedUp || Controller.lastPressedDown) {
        network.tcp.sendData(
          new TextEncoder().encode(JSON.stringify({ type: "input", key: "stop" })),
        );
        Controller.lastPressedDown = false;
        Controller.lastPressedUp = false;
      }
    } else if (upPressed && !Controller.lastPressedUp) {
      network.tcp.sendData(new TextEncoder().encode(JSON.stringify({ type: "input", key: "up" })));
      Controller.lastPressedUp = true;
    } else if (downPressed && !Controller.lastPressedDown) {
      network.tcp?.sendData(
        new TextEncoder().encode(JSON.stringify({ type: "input", key: "down" })),
      );
      Controller.lastPressedDown = true;
    }
  });
};

export function draw(registry: Registry) {
  const circles = registry.getZipper([CircleComponent, Position]);
  const rectangles = registry.getZipper([RectangleComponent, Position]);

  circles.forEach(({ CircleComponent, Position }) => {
    CircleComponent.component.setPosition(Position);
  });
  rectangles.forEach(({ RectangleComponent, Position }) => {
    RectangleComponent.component.setPosition(Position);
  });
}

export function packetHandler(registry: Registry, ctx: Context) {
  const network = ctx.libs.getNetwork<NetworkClientLibrary>();
  const jsonPackets = network.tcp.getReceivedPackets().map((packet) => {
    return JSON.parse(new TextDecoder().decode(packet));
  });

  if (!jsonPackets || jsonPackets.length === 0) return;
  jsonPackets.forEach((packet) => {
    const type = packet.type;
    if (type === "move") {
      const zipper = registry.getZipper([NetworkId, Position, Velocity]);
      const it = zipper.find((entity) => {
        return entity.NetworkId.id === packet.id;
      });
      if (!it) return;
      it.Position.x = packet.position.x;
      it.Position.y = packet.position.y;
      it.Velocity.x = packet.velocity.x;
      it.Velocity.y = packet.velocity.y;
    } else if (type === "assignId") {
      if (packet.assigned === "ball") {
        registry.addComponent(registry.entityFromIndex(2), new NetworkId(packet.id));
      } else if (packet.assigned === "paddle1") {
        registry.addComponent(registry.entityFromIndex(4), new NetworkId(packet.id));
      } else if (packet.assigned === "paddle2") {
        registry.addComponent(registry.entityFromIndex(5), new NetworkId(packet.id));
      }
    }
  });
}
