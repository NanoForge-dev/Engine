import { type RawData } from "ws";

export function parsePacketsFromChunks(
  data: Uint8Array,
  chunkedData: Uint8Array[],
  magicData: Uint8Array,
): { packets: Uint8Array[]; data: Uint8Array; chunkedData: Uint8Array[] } {
  const rechunkedData = new Uint8Array(chunkedData.reduce((sum, c) => sum + c.length, data.length));
  rechunkedData.set(data, 0);
  let offset = data.length;
  for (const c of chunkedData) {
    rechunkedData.set(c, offset);
    offset += c.length;
  }

  data = rechunkedData;
  chunkedData = [];
  const packets: Uint8Array[] = [];

  let nextPacket = uint8ArrayContains(data, magicData);
  let index = 0;
  while (nextPacket != -1) {
    packets.push(data.slice(index, index + nextPacket));
    index += nextPacket + magicData.length;
    nextPacket = uint8ArrayContains(data.subarray(index), magicData);
  }
  data = data.subarray(index);
  return { packets, data, chunkedData };
}

export function rawDataToUint8Array(data: RawData): Uint8Array {
  if (Buffer.isBuffer(data)) {
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

export function buildMagicPacket(data: Uint8Array, magicData: Uint8Array) {
  const magicPacket = new Uint8Array(data.length + magicData.length);
  magicPacket.set(data, 0);
  magicPacket.set(magicData, data.length);
  return magicPacket;
}

function uint8ArrayContains(haystack: Uint8Array, needle: Uint8Array): number {
  const buildKMPTable = (needle: Uint8Array): number[] => {
    const table = new Array(needle.length).fill(0);
    let len = 0;
    for (let i = 1; i < needle.length; ) {
      if (needle[i] === needle[len]) {
        len++;
        table[i] = len;
        i++;
      } else {
        if (len !== 0) {
          len = table[len - 1];
        } else {
          table[i] = 0;
          i++;
        }
      }
    }
    return table;
  };

  if (needle.length === 0) return 0;
  if (needle.length > haystack.length) return -1;

  const table = buildKMPTable(needle);
  let i = 0,
    j = 0;

  while (i < haystack.length) {
    if (haystack[i] === needle[j]) {
      i++;
      j++;
      if (j === needle.length) {
        return i - j;
      }
    } else {
      if (j !== 0) {
        const element = table[j - 1];
        if (element === undefined) return -1;
        j = element;
      } else {
        i++;
      }
    }
  }
  return -1;
}
