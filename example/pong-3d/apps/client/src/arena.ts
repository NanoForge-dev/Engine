import {
  BoxGeometry,
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  type Scene,
  SphereGeometry,
} from "@nanoforge-dev/graphics-3d/three";

import { FIELD, PADDLE } from "../../../shared/protocol";
import { SCALE } from "./field";

const WIDTH = FIELD.width * SCALE;
const DEPTH = FIELD.height * SCALE;

/** Adds the table, its borders and the lights to the scene. */
export const buildArena = (scene: Scene): void => {
  scene.background = new Color("#10141c");

  const table = new Mesh(
    new PlaneGeometry(WIDTH, DEPTH),
    new MeshStandardMaterial({ color: "#2f6b2a", roughness: 0.9 }),
  );
  table.rotation.x = -Math.PI / 2;
  table.receiveShadow = true;

  const centerLine = new Mesh(
    new PlaneGeometry(0.1, DEPTH),
    new MeshStandardMaterial({ color: "#94cc75" }),
  );
  centerLine.rotation.x = -Math.PI / 2;
  centerLine.position.y = 0.01;

  const borderMaterial = new MeshStandardMaterial({ color: "#c8d0dc" });
  const borderGeometry = new BoxGeometry(WIDTH + 0.4, 0.4, 0.2);
  const top = new Mesh(borderGeometry, borderMaterial);
  top.position.set(0, 0.2, -DEPTH / 2 - 0.1);
  const bottom = new Mesh(borderGeometry, borderMaterial);
  bottom.position.set(0, 0.2, DEPTH / 2 + 0.1);
  for (const border of [top, bottom]) border.castShadow = border.receiveShadow = true;

  const sun = new DirectionalLight("white", 2.5);
  sun.position.set(-4, 12, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 8, bottom: -8 });

  scene.add(table, centerLine, top, bottom, new HemisphereLight("#dfe8ff", "#20301c", 1.2), sun);
};

/** A paddle: a box as long as the 2D paddle is tall. */
export const createPaddle = (color: string): Mesh => {
  const paddle = new Mesh(
    new BoxGeometry(PADDLE.width * SCALE, 0.4, PADDLE.height * SCALE),
    new MeshStandardMaterial({ color, roughness: 0.4 }),
  );
  paddle.castShadow = true;
  return paddle;
};

export const BALL_RADIUS = 0.25;

export const createBall = (): Mesh => {
  const ball = new Mesh(
    new SphereGeometry(BALL_RADIUS, 32, 16),
    new MeshStandardMaterial({ color: "#ff4d3d", roughness: 0.3, emissive: "#401008" }),
  );
  ball.castShadow = true;
  return ball;
};
