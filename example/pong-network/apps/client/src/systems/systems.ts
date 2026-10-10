import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs/client";

import { Input, Move } from "../../../../shared/protocol";
import {
  CircleComponent,
  Controller,
  NetworkId,
  Position,
  RectangleComponent,
  Velocity,
} from "../components/components";

export function move(registry: Registry, ctx: Context) {
  const entities = registry.getZipper([Position, Velocity]);

  entities.forEach(({ Position, Velocity }) => {
    Position.x += Velocity.x * ctx.app.delta;
    Position.y += Velocity.y * ctx.app.delta;
  });
}

export const controlPlayer = (registry: Registry, ctx: Context) => {
  const entities = registry.getZipper([Controller]);
  const input = ctx.input;
  const network = ctx.network;

  entities.forEach(({ Controller }) => {
    const upPressed = input.isKeyPressed(Controller.up);
    const downPressed = input.isKeyPressed(Controller.down);
    if (upPressed == downPressed) {
      if (Controller.lastPressedUp || Controller.lastPressedDown) {
        network.packets.send(Input, { key: "stop" });
        Controller.lastPressedDown = false;
        Controller.lastPressedUp = false;
      }
    } else if (upPressed && !Controller.lastPressedUp) {
      network.packets.send(Input, { key: "up" });
      Controller.lastPressedUp = true;
    } else if (downPressed && !Controller.lastPressedDown) {
      network.packets.send(Input, { key: "down" });
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

export function applyMoves(registry: Registry, ctx: Context) {
  const zipper = registry.getZipper([NetworkId, Position, Velocity]);

  for (const { data } of ctx.network.packets.read(Move)) {
    const it = zipper.find((entity) => entity.NetworkId.id === data.id);
    if (!it) continue;
    it.Position.x = data.position.x;
    it.Position.y = data.position.y;
    it.Velocity.x = data.velocity.x;
    it.Velocity.y = data.velocity.y;
  }
}
