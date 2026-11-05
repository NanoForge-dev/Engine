import { Channel, definePacket } from "@nanoforge-dev/network";

type Vector = { x: number; y: number };

/**
 * The game runs on the server in 2D field units: a 1920 × 1080 field, x to
 * the right, y down. Clients draw it in 3D.
 */
export const FIELD = { width: 1920, height: 1080 } as const;
export const PADDLE = { width: 30, height: 300 } as const;

export const Play = definePacket("play");
export const Input = definePacket<{ key: "up" | "down" | "stop" }>("input");

/** Which paddle a client controls: 1 (left), 2 (right), or 0 when it spectates. */
export const Seat = definePacket<{ paddle: 0 | 1 | 2 }>("seat");

export const AssignId = definePacket<{ assigned: "ball" | "paddle1" | "paddle2"; id: number }>(
  "assignId",
);
export const Move = definePacket<{ id: number; position: Vector; velocity: Vector }>("move", {
  channel: Channel.UnreliableOrdered,
});
