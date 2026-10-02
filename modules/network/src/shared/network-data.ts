const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Payload of one received packet.
 *
 * @remarks
 * Returned by `getReceivedPackets`.  Like `NfFile`, it lets you read the
 * payload in the format you need, but every method is synchronous since the
 * bytes are already in memory.  Packets carry no format tag: read a packet the
 * way it was sent, `text()` for a string, `json()` for any other value.
 *
 * @example
 * ```ts
 * for (const packet of ctx.network.getReceivedPackets()) {
 *   const message = packet.json<{ type: string }>();
 * }
 * ```
 */
export class NetworkData {
  private readonly _bytes: Uint8Array;

  /**
   * @param bytes - Raw payload bytes.
   */
  constructor(bytes: Uint8Array) {
    this._bytes = bytes;
  }

  /**
   * Return the payload as a new `Uint8Array`.
   */
  public bytes(): Uint8Array<ArrayBuffer> {
    return new Uint8Array(this._bytes);
  }

  /**
   * Return the payload as a new `ArrayBuffer`.
   */
  public arrayBuffer(): ArrayBuffer {
    return this.bytes().buffer;
  }

  /**
   * Decode the payload as a UTF-8 string.
   */
  public text(): string {
    return decoder.decode(this._bytes);
  }

  /**
   * Parse the payload as JSON and return the result.
   *
   * @throws `SyntaxError` When the payload is not valid JSON.
   */
  public json<T = any>(): T {
    return JSON.parse(this.text());
  }
}

/**
 * Anything the network methods can send.
 *
 * @remarks
 * - `NetworkData`: its bytes, so a received packet can be relayed.
 * - `ArrayBuffer` or any `ArrayBufferView` (`Uint8Array`, `DataView`, …): the
 *   bytes as they are.
 * - `string`: its UTF-8 text, read back with `NetworkData.text`.
 * - Any other value: its `JSON.stringify` text, read back with
 *   `NetworkData.json`.
 */
export type NetworkPayload =
  NetworkData | ArrayBuffer | ArrayBufferView | string | number | boolean | null | object;

/**
 * Turn a payload into the bytes sent over the network.
 *
 * @param payload - Value to send.
 * @returns The payload bytes.
 * @throws `TypeError` When the payload cannot be encoded as JSON.
 */
export const encodeNetworkPayload = (payload: NetworkPayload): Uint8Array => {
  if (payload instanceof NetworkData) return payload.bytes();
  if (ArrayBuffer.isView(payload)) {
    return new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength);
  }
  if (payload instanceof ArrayBuffer) return new Uint8Array(payload);
  if (typeof payload === "string") return encoder.encode(payload);

  const json: string | undefined = JSON.stringify(payload);
  if (json === undefined) throw new TypeError(`Cannot send a ${typeof payload} over the network`);
  return encoder.encode(json);
};
