/**
 * Messages of the peer-to-peer signaling server (`LISTENING_SIGNALING_PORT`),
 * which pairs a host with its joiners for the WebRTC handshake only.
 *
 * @remarks
 * A host connects without a `room` query parameter and is given a room code;
 * a joiner connects with `?room=<code>`.  Every frame a joiner sends reaches
 * the host wrapped in a `signal` with the joiner's id; the host answers with a
 * `signal` addressed `to` that id, and the server forwards its `data` alone.
 * Joiners therefore speak the same protocol as with a dedicated UDP server.
 */

/** Query parameter a joiner names its room with. */
export const ROOM_PARAM = "room";

/**
 * Close code of a joiner's signaling socket when its host left: the game is
 * over, whatever its data channels report (Chrome kept those of a closed host
 * tab open for minutes in testing).
 */
export const HOST_LEFT_CODE = 4001;

/** Largest signaling frame accepted, far above any SDP offer or ICE candidate. */
export const MAX_SIGNAL_BYTES = 64 * 1024;

/** Server → host: the code joiners use to reach this host. */
export type RoomMessage = { type: "room"; room: string };

/** Server → host: a frame a joiner sent. */
export type JoinerSignalMessage = { type: "signal"; from: string; data: unknown };

/** Host → server: a frame for one joiner of its room. */
export type HostSignalMessage = { type: "signal"; to: string; data: unknown };

/** Server → host: a joiner's signaling socket closed. */
export type LeaveMessage = { type: "leave"; from: string };

/**
 * Parse a signaling frame written by a peer.
 *
 * @returns The parsed object, or `null` for anything else than a JSON object.
 */
export const parseSignal = (frame: string): Record<string, unknown> | null => {
  try {
    const message: unknown = JSON.parse(frame);
    return typeof message === "object" && message !== null
      ? (message as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};
