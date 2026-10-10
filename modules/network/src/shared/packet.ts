import type { Context } from "@nanoforge-dev/common";

import { type Channel, type ChannelOptions, DEFAULT_CHANNEL } from "./channels";
import { NetworkData } from "./network-data";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Longest packet name in UTF-8 bytes, as its length is written on one byte. */
const MAX_NAME_BYTES = 255;

/** Unknown packet names warned about: past it, they are dropped silently (peers choose them). */
const MAX_WARNED_NAMES = 100;

/**
 * Options of `definePacket`.
 *
 * @typeParam T - Payload type of the packet.
 */
export type PacketOptions<T> = {
  /**
   * Channel the packet is sent on when `send` gets no `channel` option.
   *
   * @defaultValue `Channel.ReliableOrdered`
   */
  channel?: Channel;
  /**
   * Check a received payload before it reaches listeners or `read`.  Packets
   * that fail it, or make it throw, are dropped with a warning.
   */
  validate?: (data: unknown) => data is T;
};

/**
 * A packet type, shared by the client and the server.
 *
 * @remarks
 * Create it with `definePacket`, in a file both apps import.  Its `name` is
 * written in front of every packet of this type, so both sides must use the
 * same one.
 *
 * @typeParam T - Payload type of the packet.
 */
export interface PacketDefinition<T> {
  /** Name identifying the packet type on the wire. */
  readonly name: string;
  /** Channel used when `send` gets no `channel` option. */
  readonly channel: Channel;
  /** Check run on every received payload, see `PacketOptions.validate`. */
  readonly validate?: ((data: unknown) => data is T) | undefined;
  /** Never set: only keeps definitions of different payloads apart. */
  readonly __payload?: T;
}

/**
 * Declare a packet type.
 *
 * @example
 * ```ts
 * // protocol.ts, imported by the client and the server
 * export const Move = definePacket<{ id: number; x: number; y: number }>("move", {
 *   channel: Channel.UnreliableOrdered,
 * });
 * export const Play = definePacket("play"); // no payload: `send(Play)`
 * ```
 *
 * @param name - Name identifying the type on the wire, unique in the game.
 * @param options - Default `channel` and payload `validate` check.
 * @returns The packet definition, used by `packets.on`, `read` and `send`.
 * @throws When the name is empty or longer than 255 UTF-8 bytes.
 */
export const definePacket = <T = void>(
  name: string,
  { channel = DEFAULT_CHANNEL, validate }: PacketOptions<T> = {},
): PacketDefinition<T> => {
  const length = encoder.encode(name).length;
  if (length === 0 || length > MAX_NAME_BYTES) {
    throw new Error(`Packet name must be 1 to ${MAX_NAME_BYTES} UTF-8 bytes long, got "${name}"`);
  }
  return { name, channel, validate };
};

/**
 * Prefix a payload with the name of its packet type.
 *
 * @param name - Packet type name, or `null` for a packet sent with `sendData`.
 * @param payload - Payload bytes.
 * @returns `[name length u8][name UTF-8][payload]`, the length being `0` when
 * the name is `null`.
 */
export const encodePacket = (name: string | null, payload: Uint8Array): Uint8Array<ArrayBuffer> => {
  const header = encoder.encode(name ?? "");
  const packet = new Uint8Array(1 + header.length + payload.length);
  packet[0] = header.length;
  packet.set(header, 1);
  packet.set(payload, 1 + header.length);
  return packet;
};

/**
 * Arguments of the typed send methods after the definition: the payload, which
 * can be left out when it accepts `undefined` (a packet without payload is
 * `void`), then the options.
 *
 * @typeParam T - Payload type of the packet.
 */
export type PacketArgs<T> = undefined extends T
  ? [data?: T, options?: ChannelOptions]
  : [data: T, options?: ChannelOptions];

/**
 * Encode a typed packet: its payload as JSON, or nothing for `undefined`,
 * prefixed with its type name.
 *
 * @throws `TypeError` When the payload cannot be encoded as JSON.
 */
export const encodeTypedPacket = (
  packet: PacketDefinition<unknown>,
  data: unknown,
): Uint8Array<ArrayBuffer> => {
  if (data === undefined) return encodePacket(packet.name, new Uint8Array());
  const json: string | undefined = JSON.stringify(data);
  if (json === undefined)
    throw new TypeError(`Cannot send a ${typeof data} as packet "${packet.name}"`);
  return encodePacket(packet.name, encoder.encode(json));
};

/**
 * Split a packet into the name of its type and its payload.
 *
 * @param packet - Packet built by `encodePacket`.
 * @returns The name, `null` for a packet sent with `sendData`, and the
 * payload; or `null` when the packet is empty or truncated.
 */
export const decodePacket = (
  packet: Uint8Array,
): { name: string | null; data: Uint8Array } | null => {
  if (packet.length === 0) return null;
  const end = 1 + (packet[0] ?? 0);
  if (packet.length < end) return null;
  return {
    name: end === 1 ? null : decoder.decode(packet.subarray(1, end)),
    data: packet.subarray(end),
  };
};

/**
 * Callback of `packets.on`, called with the payload of each packet received.
 *
 * @typeParam T - Payload type of the packet.
 * @typeParam Info - Where the packet comes from: its channel, and its
 * sender on the server.
 */
export type PacketListener<T, Info> = (data: T, info: Info & { ctx: Context }) => void;

/** A received packet with a type name, waiting to be dispatched. */
export type TypedPacket<Info> = { name: string; data: Uint8Array; info: Info };

/**
 * Sort packets received from a transport: `sendData` payloads go to `raw`,
 * typed packets to `typed`.  Empty or truncated packets are dropped.
 */
export const sortPackets = <Info>(
  packets: Uint8Array[],
  info: Info,
  raw: NetworkData[],
  typed: TypedPacket<Info>[],
): void => {
  for (const packet of packets) {
    const decoded = decodePacket(packet);
    if (!decoded) continue;
    if (decoded.name === null) raw.push(new NetworkData(decoded.data));
    else typed.push({ name: decoded.name, data: decoded.data, info });
  }
};

type FramePacket<Info> = { name: string; value: unknown; info: Info; valid?: boolean };

/**
 * Calls the listeners of each received packet type and keeps the packets of
 * the current tick for `read`.  Shared by the client and the server.
 */
export class PacketDispatcher<Info> {
  private readonly _definitions = new Map<string, PacketDefinition<unknown>>();
  private readonly _listeners = new Map<string, Set<PacketListener<any, Info>>>();
  private readonly _warned = new Set<string>();
  private _frame: FramePacket<Info>[] = [];

  /**
   * Be notified of every packet of a type, each tick before the ECS systems.
   *
   * @returns A function that removes the listener.
   * @throws When another definition with the same name has another channel or
   * `validate`.
   */
  public on<T>(
    packet: PacketDefinition<T>,
    listener: PacketListener<NoInfer<T>, Info>,
  ): () => void {
    this.define(packet);
    const listeners = this._listeners.get(packet.name) ?? new Set();
    listeners.add(listener);
    this._listeners.set(packet.name, listeners);
    return () => listeners.delete(listener);
  }

  /**
   * Return the packets of a type received this tick.
   *
   * @throws When another definition with the same name has another channel or
   * `validate`.
   */
  public read<T>(packet: PacketDefinition<T>): (Info & { data: T })[] {
    this.define(packet);
    return this._frame
      .filter((received) => received.name === packet.name && this.check(received))
      .map((received) => ({ ...received.info, data: received.value as T }));
  }

  /**
   * Start a new tick: decode `packets` and call their listeners, in order.
   *
   * @param packets - Typed packets received since the last tick.
   * @param ctx - Context handed to the listeners.
   */
  public dispatch(packets: TypedPacket<Info>[], ctx: Context): void {
    for (const { name } of this._frame) {
      if (this._definitions.has(name) || this._warned.has(name)) continue;
      if (this._warned.size >= MAX_WARNED_NAMES) break;
      this._warned.add(name);
      console.warn(`Network: no listener or reader for packet "${name}", dropping them`);
    }

    this._frame = [];
    for (const { name, data, info } of packets) {
      let value: unknown;
      try {
        value = data.length === 0 ? undefined : JSON.parse(decoder.decode(data));
      } catch (error) {
        console.warn(`Network: packet "${name}" is not valid JSON, dropped`, { cause: error });
        continue;
      }
      const received: FramePacket<Info> = { name, value, info };
      this._frame.push(received);

      const listeners = this._listeners.get(name);
      if (!listeners?.size || !this.check(received)) continue;
      for (const listener of [...listeners]) this.call(listener, received, ctx);
    }
  }

  private define(packet: PacketDefinition<unknown>): void {
    const known = this._definitions.get(packet.name);
    if (known && (known.channel !== packet.channel || known.validate !== packet.validate)) {
      throw new Error(`Packet "${packet.name}" is defined twice, with another channel or validate`);
    }
    if (!known) this._definitions.set(packet.name, packet);
  }

  /** Run the type's `validate` once per packet. */
  private check(received: FramePacket<Info>): boolean {
    if (received.valid === undefined) {
      const validate = this._definitions.get(received.name)?.validate;
      try {
        received.valid = !validate || validate(received.value);
      } catch {
        received.valid = false;
      }
      if (!received.valid) console.warn(`Network: packet "${received.name}" is invalid, dropped`);
    }
    return received.valid;
  }

  private call(
    listener: PacketListener<unknown, Info>,
    received: FramePacket<Info>,
    ctx: Context,
  ): void {
    const fail = (error: unknown) =>
      console.error(`Network: listener of packet "${received.name}" failed`, { cause: error });
    try {
      const result: unknown = listener(received.value, { ...received.info, ctx });
      if (result instanceof Promise) result.catch(fail);
    } catch (error) {
      fail(error);
    }
  }
}
