import type { NetworkClientContextApi } from "../client/network-client-context.type";
import type { NetworkServerContextApi } from "../server/network-server-context.type";

/**
 * Public surface of `NetworkPeerLibrary`, exposed on `Context.network`.
 *
 * @remarks
 * Every player, the host included, uses the client API (`packets.send`,
 * `sendData`, …) to talk to the host's server.  The host also gets that
 * server as `server`, with the same API as a dedicated server.
 *
 * @example
 * ```ts
 * const room = new URLSearchParams(location.search).get("room");
 * if (room) await network.join(room);
 * else {
 *   const server = await network.host();
 *   server.packets.on(Input, ({ key }, { clientId }) => handleInput(clientId, key, server));
 * }
 * network.packets.send(Play); // on the host, reaches its own server
 * ```
 */
export interface NetworkPeerContextApi extends NetworkClientContextApi {
  /** Whether this player hosts the game. */
  readonly isHost: boolean;
  /**
   * Code joiners use to reach the host, once `host()` resolved.  Turns
   * `undefined` when the host's signaling connection closes: the server then
   * closes the room, and its joiners leave.
   */
  readonly room: string | undefined;
  /**
   * The host's server, same API as a dedicated server's `ctx.network`.
   * `undefined` on joiners, so authority code checks it first.
   */
  readonly server: NetworkServerContextApi | undefined;
  /**
   * Host a game: get a room from the signaling server and accept joiners.
   * This player then joins its own server through an in-memory loopback.
   *
   * @remarks
   * This player's session is already in `server.clients.list()`, with id
   * `clientId`, when `host()` resolves: `server.clients.onConnect` only fires
   * for joiners.
   *
   * @returns The server, also available as `server`.
   * @throws When already hosting or joined, or the signaling server is unreachable.
   */
  host(): Promise<NetworkServerContextApi>;
  /**
   * Join the game hosted in `room`.  Resolves once the four channels to the
   * host are open.
   *
   * @throws When already hosting or joined, the room does not exist, or the
   * channels are not open within `CONNECT_TIMEOUT_MS` (add a TURN server to
   * `ICE_SERVERS` for players behind strict NATs).
   */
  join(room: string): Promise<void>;
  /** Stop hosting or leave the host: every connection is closed. */
  leave(): void;
}
