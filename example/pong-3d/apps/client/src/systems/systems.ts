import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs/client";
import { Vector3 } from "@nanoforge-dev/graphics-3d/three";
import type { InputEnum } from "@nanoforge-dev/input";
import { ControllerAxis, ControllerButton } from "@nanoforge-dev/input/controller";

import { FIELD, Input, Move, PADDLE } from "../../../../shared/protocol";
import { CameraRig, Model, NetworkId, Player, Position, Velocity } from "../components/components";
import { fieldToWorld } from "../field";

/** Predicts movement between two server updates. */
export function move(registry: Registry, ctx: Context) {
  registry.getZipper([Position, Velocity]).forEach(({ Position, Velocity }) => {
    Position.x += Velocity.x * ctx.app.delta;
    Position.y += Velocity.y * ctx.app.delta;
  });
}

/** Applies the server's positions and velocities. */
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

/**
 * Sends the player's input. The camera looks down the table from behind the
 * paddle, so "left" and "right" on screen are "up" and "down" on the field,
 * swapped for the right paddle.
 */
export function controlPlayer(registry: Registry, ctx: Context) {
  const input = ctx.input;
  const pad = ctx.controller;

  registry.getZipper([Player]).forEach(({ Player }) => {
    if (Player.seat === 0) return;
    const stickX = pad.getAxis(ControllerAxis.LeftStickX);
    const left =
      Player.left.some((key: InputEnum) => input.isKeyPressed(key)) ||
      pad.isButtonPressed(ControllerButton.DPadLeft) ||
      stickX < -0.5;
    const right =
      Player.right.some((key: InputEnum) => input.isKeyPressed(key)) ||
      pad.isButtonPressed(ControllerButton.DPadRight) ||
      stickX > 0.5;

    let key: "up" | "down" | "stop" = "stop";
    if (left !== right) key = right === (Player.seat === 1) ? "down" : "up";
    if (key === Player.sent) return;
    ctx.network.packets.send(Input, { key });
    Player.sent = key;
  });
}

/** Places every model at its entity's position. */
export function draw(registry: Registry) {
  registry.getZipper([Model, Position]).forEach(({ Model, Position }) => {
    const { object } = Model;
    fieldToWorld(
      Position.x + Model.offsetX,
      Position.y + Model.offsetY,
      object.position.y,
      object.position,
    );
  });
}

// Above and behind the right end of the table, framing both paddles.
const SPECTATOR_EYE = fieldToWorld(FIELD.width + 900, FIELD.height / 2, 12);
const SPECTATOR_LOOK = fieldToWorld(FIELD.width / 2 + 270, FIELD.height / 2);
const eye = new Vector3();
const look = new Vector3();

/**
 * Players see the table from just above and behind their own paddle,
 * following it. Spectators see it from above its right end.
 */
export function followCamera(registry: Registry, ctx: Context) {
  const players = registry.getZipper([Player, CameraRig]);
  const paddles = registry.getZipper([NetworkId, Position]);

  players.forEach(({ Player, CameraRig }) => {
    const paddle = paddles.find((entity) => entity.NetworkId.id === Player.seat);
    if (Player.seat !== 0 && paddle) {
      const side = Player.seat === 1 ? 1 : -1;
      const centerY = paddle.Position.y + PADDLE.height / 2;
      // Behind and above the paddle, looking just short of the center line: the paddle stays in view.
      fieldToWorld(paddle.Position.x + PADDLE.width / 2 - side * 400, centerY, 3, eye);
      fieldToWorld(FIELD.width / 2 - side * 200, (centerY + FIELD.height / 2) / 2, 0, look);
    } else {
      eye.copy(SPECTATOR_EYE);
      look.copy(SPECTATOR_LOOK);
    }

    const camera = ctx.graphics.camera;
    if (!CameraRig.look) {
      CameraRig.look = look.clone();
      camera.position.copy(eye);
    }
    // Eases toward the goal in about a fifth of a second, whatever the frame rate.
    const t = 1 - Math.exp(-ctx.app.delta / 120);
    camera.position.lerp(eye, t);
    CameraRig.look.lerp(look, t);
    camera.lookAt(CameraRig.look);
  });
}
