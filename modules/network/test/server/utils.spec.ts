import { describe, expect, it } from "vitest";

import { rawDataToUint8Array } from "../../src/server/utils";

describe("rawDataToUint8Array", () => {
  it("should convert a Node.js Buffer to Uint8Array", () => {
    const buf = Buffer.from([1, 2, 3]);
    const result = rawDataToUint8Array(buf);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result).toStrictEqual(new Uint8Array([1, 2, 3]));
  });

  it("should convert an ArrayBuffer to Uint8Array", () => {
    const buf = new Uint8Array([4, 5, 6]).buffer;
    const result = rawDataToUint8Array(buf);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result).toStrictEqual(new Uint8Array([4, 5, 6]));
  });

  it("should concatenate an array of Buffers into a single Uint8Array", () => {
    const bufs = [Buffer.from([1, 2]), Buffer.from([3, 4])];
    const result = rawDataToUint8Array(bufs);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result).toStrictEqual(new Uint8Array([1, 2, 3, 4]));
  });

  it("should throw on an unsupported RawData type", () => {
    expect(() => rawDataToUint8Array("bad" as any)).toThrow("Unsupported WebSocket RawData type");
  });
});
