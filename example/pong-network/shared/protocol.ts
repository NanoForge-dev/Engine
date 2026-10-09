import { Channel, definePacket } from "@nanoforge-dev/network";

type Vector = { x: number; y: number };

export const Play = definePacket("play");
export const Input = definePacket<{ key: "up" | "down" | "stop" }>("input");

export const AssignId = definePacket<{ assigned: "ball" | "paddle1" | "paddle2"; id: number }>(
  "assignId",
);
export const Move = definePacket<{ id: number; position: Vector; velocity: Vector }>("move", {
  channel: Channel.UnreliableOrdered,
});
