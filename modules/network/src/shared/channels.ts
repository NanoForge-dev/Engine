/**
 * Delivery guarantees a packet can be sent with.
 *
 * @remarks
 * Reliable channels are carried by the TCP WebSocket, unreliable channels by
 * WebRTC data channels.  Over TCP, `ReliableUnordered` is delivered in order
 * in practice: it only promises that nothing is lost.
 */
export enum Channel {
  /** Never lost, delivered in send order. */
  ReliableOrdered = "reliable-ordered",
  /** Never lost, no ordering promise. */
  ReliableUnordered = "reliable-unordered",
  /** May be lost; a packet older than the last one delivered is dropped. */
  UnreliableOrdered = "unreliable-ordered",
  /** May be lost or arrive in any order. */
  UnreliableUnordered = "unreliable-unordered",
}

/** Channels carried by the TCP WebSocket. */
export type ReliableChannel = Channel.ReliableOrdered | Channel.ReliableUnordered;

/** Channels carried by WebRTC data channels. */
export type UnreliableChannel = Channel.UnreliableOrdered | Channel.UnreliableUnordered;

export const RELIABLE_CHANNELS = [Channel.ReliableOrdered, Channel.ReliableUnordered] as const;

export const UNRELIABLE_CHANNELS = [
  Channel.UnreliableOrdered,
  Channel.UnreliableUnordered,
] as const;

/**
 * First byte of every binary TCP frame, telling which reliable channel the
 * rest of the frame belongs to.
 */
const RELIABLE_CHANNEL_TAGS: Record<ReliableChannel, number> = {
  [Channel.ReliableOrdered]: 0,
  [Channel.ReliableUnordered]: 1,
};

/**
 * Prefix a payload with the tag of its reliable channel.
 *
 * @param channel - Channel the payload is sent on.
 * @param data - Raw payload bytes.
 * @returns The frame to send over the TCP WebSocket.
 */
export const encodeReliableFrame = (
  channel: ReliableChannel,
  data: Uint8Array,
): Uint8Array<ArrayBuffer> => {
  const frame = new Uint8Array(data.length + 1);
  frame[0] = RELIABLE_CHANNEL_TAGS[channel];
  frame.set(data, 1);
  return frame;
};

/**
 * Split a TCP frame into its reliable channel and payload.
 *
 * @param frame - Binary frame received over the TCP WebSocket.
 * @returns The channel and payload, or `null` for an empty or unknown frame.
 */
export const decodeReliableFrame = (
  frame: Uint8Array,
): { channel: ReliableChannel; data: Uint8Array } | null => {
  const channel = RELIABLE_CHANNELS.find((c) => RELIABLE_CHANNEL_TAGS[c] === frame[0]);
  if (channel === undefined) return null;
  return { channel, data: frame.slice(1) };
};

/** WebRTC data channel options, identical for both unreliable channels. */
export const UNRELIABLE_CHANNEL_OPTIONS: RTCDataChannelInit = {
  ordered: false,
  maxRetransmits: 0,
};

/**
 * Find the unreliable channel a WebRTC data channel stands for.
 *
 * @param label - Label of the data channel, which is the channel value.
 * @returns The channel, or `undefined` for an unknown label.
 */
export const unreliableChannelFromLabel = (label: string): UnreliableChannel | undefined =>
  UNRELIABLE_CHANNELS.find((channel) => channel === label);

/** Size of the sequence number header of `UnreliableOrdered` packets. */
export const SEQUENCE_HEADER_BYTES = 4;

const HALF_SEQUENCE_RANGE = 2 ** 31;

/**
 * Numbers outgoing packets and drops late incoming ones on one
 * `UnreliableOrdered` link.
 *
 * @remarks
 * Each packet starts with a big-endian uint32 sequence number.  A packet is
 * delivered only when it is newer than the last one delivered, compared as
 * serial numbers so the counter can wrap around.  The two directions are
 * independent: one instance per peer handles both.
 */
export class PacketSequencer {
  private _next = 0;
  private _last: number | undefined;

  /**
   * Prefix a payload with the next outgoing sequence number.
   *
   * @param data - Raw payload bytes.
   * @returns The packet to send.
   */
  public wrap(data: Uint8Array): Uint8Array<ArrayBuffer> {
    const packet = new Uint8Array(data.length + SEQUENCE_HEADER_BYTES);
    new DataView(packet.buffer).setUint32(0, this._next);
    packet.set(data, SEQUENCE_HEADER_BYTES);
    this._next = (this._next + 1) >>> 0;
    return packet;
  }

  /**
   * Strip the sequence number of an incoming packet.
   *
   * @param packet - Packet received from the peer.
   * @returns The payload, or `null` when the packet is late, a duplicate, or
   * too short to hold a header.
   */
  public unwrap(packet: Uint8Array): Uint8Array | null {
    if (packet.length < SEQUENCE_HEADER_BYTES) return null;

    const sequence = new DataView(packet.buffer, packet.byteOffset).getUint32(0);
    if (this._last !== undefined) {
      const distance = (sequence - this._last) >>> 0;
      if (distance === 0 || distance >= HALF_SEQUENCE_RANGE) return null;
    }
    this._last = sequence;
    return packet.slice(SEQUENCE_HEADER_BYTES);
  }
}
