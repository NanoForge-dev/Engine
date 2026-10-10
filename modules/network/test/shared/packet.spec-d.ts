import { describe, it } from "vitest";

// From the type files: both entries augment `Context.network`, so they cannot share a program.
import type { ClientPacketsApi } from "../../src/client/network-client-context.type";
import { Channel, definePacket } from "../../src/index";
import type { ServerPacketsApi } from "../../src/server/network-server-context.type";

declare const client: ClientPacketsApi;
declare const server: ServerPacketsApi;

const Move = definePacket<{ x: number }>("move");
const Play = definePacket("play");

describe("packets (type-level)", () => {
  it("accepts the payload of the definition", () => {
    client.send(Move, { x: 1 });
    client.send(Play);
    client.send(Play, undefined, { channel: Channel.UnreliableOrdered });
    server.sendToClient("client-0", Play);
    client.on(Play, () => {});
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
    // @ts-expect-error Play carries no payload
    server.sendToClient("client-0", Play, { x: 1 });
    // @ts-expect-error Move needs its payload
    client.send(Move);
    // @ts-expect-error Move needs its payload
    server.sendToAll(Move);
    // @ts-expect-error the listener must take the definition's payload
    client.on(Move, (move: { y: number }) => move.y);
  });
});
