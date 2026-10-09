import { describe, it } from "vitest";

// From the type files: both entries augment `Context.network`, so they cannot share a program.
import type { ClientPacketsApi } from "../../src/client/network-client-context.type";
import { definePacket } from "../../src/index";
import type { ServerPacketsApi } from "../../src/server/network-server-context.type";

declare const client: ClientPacketsApi;
declare const server: ServerPacketsApi;

const Move = definePacket<{ x: number }>("move");
const Play = definePacket("play");

describe("packets (type-level)", () => {
  it("accepts the payload of the definition", () => {
    client.send(Move, { x: 1 });
    client.send(Play, null);
    server.sendToAll(Move, { x: 1 });
    server.sendToClient("client-0", Move, { x: 1 });
    client.on(Move, (move) => move.x.toFixed());
    server.on(Move, (move, { clientId }) => `${clientId}${move.x}`);
    client.read(Move).map(({ data }) => data.x);
  });

  it("rejects another payload", () => {
    // @ts-expect-error x must be a number
    client.send(Move, { x: "1" });
    // @ts-expect-error x must be a number
    server.sendToAll(Move, { x: "1" });
    // @ts-expect-error Play carries null
    server.sendToClient("client-0", Play, { x: 1 });
    // @ts-expect-error the listener must take the definition's payload
    client.on(Move, (move: { y: number }) => move.y);
  });
});
