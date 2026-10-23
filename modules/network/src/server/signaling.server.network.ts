import type { Server, ServerWebSocket } from "bun";

import {
  HOST_LEFT_CODE,
  type JoinerSignalMessage,
  type LeaveMessage,
  MAX_SIGNAL_BYTES,
  ROOM_PARAM,
  type RoomMessage,
  parseSignal,
} from "../shared/signaling";

/** Room codes avoid 0/O and 1/I, so they can be read aloud or typed. */
const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ROOM_LENGTH = 6;

type SignalingSocketData =
  { role: "host"; room?: string } | { role: "joiner"; room: string; id: string };

type SignalingSocket = ServerWebSocket<SignalingSocketData>;

type Room = { host: SignalingSocket; joiners: Map<string, SignalingSocket> };

/** 6 characters from a 32-letter alphabet: each random byte maps without bias. */
const generateRoomCode = (): string =>
  Array.from(
    crypto.getRandomValues(new Uint8Array(ROOM_LENGTH)),
    (byte) => ROOM_ALPHABET[byte % ROOM_ALPHABET.length],
  ).join("");

/**
 * WebSocket server pairing peer-to-peer hosts with their joiners for the
 * WebRTC handshake (see `shared/signaling.ts` for the protocol).
 *
 * @remarks
 * Game traffic never goes through it: once a joiner's data channels are open,
 * its signaling socket is idle.  Frames are written by players, so they are
 * parsed defensively, capped at `MAX_SIGNAL_BYTES`, and a joiner can only ever
 * reach its own room's host.
 *
 * Runs on `Bun.serve`; started by `NetworkServerLibrary` when
 * `NETWORK_MODE` is `p2p`, on `LISTENING_TCP_PORT`.
 */
export class SignalingServer {
  private readonly _rooms = new Map<string, Room>();
  private _server: Server<SignalingSocketData> | undefined;

  constructor(
    private _port: number,
    private _host: string,
    private _cert?: string,
    private _key?: string,
  ) {}

  /** Start accepting hosts and joiners. */
  public listen(): void {
    const cert = this._cert;
    const key = this._key;
    const secure = cert !== undefined && key !== undefined;

    this._server = Bun.serve<SignalingSocketData>({
      port: this._port,
      hostname: this._host,
      ...(secure ? { tls: { cert: Bun.file(cert), key: Bun.file(key) } } : {}),
      fetch: (request, server) => {
        const room = new URL(request.url).searchParams.get(ROOM_PARAM);
        if (room !== null && !this._rooms.has(room)) {
          return new Response("Unknown room", { status: 404 });
        }

        const data: SignalingSocketData =
          room === null ? { role: "host" } : { role: "joiner", room, id: crypto.randomUUID() };
        if (server.upgrade(request, { data })) return undefined;
        return new Response("Expected a WebSocket connection", { status: 426 });
      },
      websocket: {
        maxPayloadLength: MAX_SIGNAL_BYTES,
        open: (webSocket) => this.open(webSocket),
        message: (webSocket, message) =>
          this.message(
            webSocket,
            typeof message === "string" ? message : new TextDecoder().decode(message),
          ),
        close: (webSocket) => this.close(webSocket),
      },
    });

    console.log(
      `${secure ? "Secure " : ""}Signaling server listening on ` +
        `${secure ? "wss" : "ws"}://${this._host}:${this._port}`,
    );
  }

  /** Stop the server and forget every room. */
  public stop(): void {
    this._server?.stop(true);
    this._server = undefined;
    this._rooms.clear();
  }

  private open(webSocket: SignalingSocket): void {
    const data = webSocket.data;
    if (data.role === "host") {
      let room = generateRoomCode();
      while (this._rooms.has(room)) room = generateRoomCode();
      data.room = room;
      this._rooms.set(room, { host: webSocket, joiners: new Map() });
      webSocket.send(JSON.stringify({ type: "room", room } satisfies RoomMessage));
      return;
    }

    // The host may have left between the upgrade request and now.
    const room = this._rooms.get(data.room);
    if (!room) {
      webSocket.close(1001, "Unknown room");
      return;
    }
    room.joiners.set(data.id, webSocket);
  }

  private message(webSocket: SignalingSocket, frame: string): void {
    const data = webSocket.data;
    const room = data.room === undefined ? undefined : this._rooms.get(data.room);
    const message = parseSignal(frame);
    if (!room || !message) return;

    if (data.role === "joiner") {
      if (room.joiners.get(data.id) !== webSocket) return;
      room.host.send(
        JSON.stringify({
          type: "signal",
          from: data.id,
          data: message,
        } satisfies JoinerSignalMessage),
      );
      return;
    }

    if (message.type !== "signal" || typeof message.to !== "string") return;
    if (message.data === undefined) return;
    room.joiners.get(message.to)?.send(JSON.stringify(message.data));
  }

  private close(webSocket: SignalingSocket): void {
    const data = webSocket.data;
    const code = data.room;
    const room = code === undefined ? undefined : this._rooms.get(code);
    if (!room || code === undefined) return;

    if (data.role === "joiner") {
      if (room.joiners.get(data.id) !== webSocket) return;
      room.joiners.delete(data.id);
      room.host.send(JSON.stringify({ type: "leave", from: data.id } satisfies LeaveMessage));
      return;
    }

    if (room.host !== webSocket) return;
    this._rooms.delete(code);
    for (const joiner of room.joiners.values()) joiner.close(HOST_LEFT_CODE, "Host left");
  }
}
