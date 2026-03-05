import { describe, expect, it } from "vitest";

import { buildMagicPacket, parsePacketsFromChunks } from "../src/utils";

const magic = new TextEncoder().encode("END");

describe("buildMagicPacket", () => {
  it("should append the magic bytes after the payload", () => {
    const data = new Uint8Array([1, 2, 3]);
    const result = buildMagicPacket(data, magic);
    expect(result).toStrictEqual(new Uint8Array([1, 2, 3, ...magic]));
  });

  it("should produce a buffer of length data + magic", () => {
    const data = new Uint8Array([10, 20]);
    const result = buildMagicPacket(data, magic);
    expect(result.length).toBe(data.length + magic.length);
  });

  it("should work with an empty payload", () => {
    const result = buildMagicPacket(new Uint8Array(), magic);
    expect(result).toStrictEqual(magic);
  });
});

describe("parsePacketsFromChunks", () => {
  it("should parse a single complete packet from a flat buffer", () => {
    const payload = new Uint8Array([10, 20, 30]);
    const stream = buildMagicPacket(payload, magic);
    const { packets, data, chunkedData } = parsePacketsFromChunks(stream, [], magic);
    expect(packets).toHaveLength(1);
    expect(packets[0]).toStrictEqual(payload);
    expect(data.length).toBe(0);
    expect(chunkedData).toStrictEqual([]);
  });

  it("should parse two consecutive packets from a flat buffer", () => {
    const p1 = new Uint8Array([1]);
    const p2 = new Uint8Array([2]);
    const stream = new Uint8Array([...buildMagicPacket(p1, magic), ...buildMagicPacket(p2, magic)]);
    const { packets } = parsePacketsFromChunks(stream, [], magic);
    expect(packets).toHaveLength(2);
    expect(packets[0]).toStrictEqual(p1);
    expect(packets[1]).toStrictEqual(p2);
  });

  it("should retain an incomplete packet as leftover data", () => {
    const incomplete = new Uint8Array([5, 6, 7]);
    const { packets, data } = parsePacketsFromChunks(incomplete, [], magic);
    expect(packets).toHaveLength(0);
    expect(data).toStrictEqual(incomplete);
  });

  it("should reassemble a packet split across multiple chunks", () => {
    const payload = new Uint8Array([1, 2, 3]);
    const full = buildMagicPacket(payload, magic);
    const chunk1 = full.slice(0, 2);
    const chunk2 = full.slice(2);
    const { packets } = parsePacketsFromChunks(new Uint8Array(), [chunk1, chunk2], magic);
    expect(packets).toHaveLength(1);
    expect(packets[0]).toStrictEqual(payload);
  });

  it("should combine leftover data with new chunks to complete a packet", () => {
    const payload = new Uint8Array([10, 20]);
    const full = buildMagicPacket(payload, magic);
    const leftover = full.slice(0, 1);
    const rest = full.slice(1);
    const { packets } = parsePacketsFromChunks(leftover, [rest], magic);
    expect(packets).toHaveLength(1);
    expect(packets[0]).toStrictEqual(payload);
  });

  it("should return empty packets and an empty chunkedData on an empty input", () => {
    const { packets, data, chunkedData } = parsePacketsFromChunks(new Uint8Array(), [], magic);
    expect(packets).toHaveLength(0);
    expect(data.length).toBe(0);
    expect(chunkedData).toStrictEqual([]);
  });
});
