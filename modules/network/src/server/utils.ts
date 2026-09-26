/**
 * Shapes a WebSocket message can arrive in.
 *
 * @remarks
 * `Bun.serve` delivers binary frames as `Buffer`, but the other variants are
 * accepted so the parser stays tolerant of any runtime that hands us a view
 * over the same bytes.
 */
export type RawData = Buffer | ArrayBuffer | Uint8Array | Uint8Array[];

export function rawDataToUint8Array(data: RawData): Uint8Array {
  if (Buffer.isBuffer(data)) {
    return new Uint8Array(data);
  }

  if (data instanceof Uint8Array) {
    return new Uint8Array(data);
  }

  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }

  if (Array.isArray(data)) {
    const totalLength = data.reduce((sum, buf) => sum + buf.length, 0);
    const out = new Uint8Array(totalLength);

    let offset = 0;
    for (const buf of data) {
      out.set(buf, offset);
      offset += buf.length;
    }

    return out;
  }

  throw new Error("Unsupported WebSocket RawData type");
}
