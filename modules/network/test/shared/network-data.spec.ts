import { describe, expect, it } from "vitest";

import { NetworkData, encodeNetworkPayload } from "../../src/shared/network-data";

const utf8 = (text: string) => new TextEncoder().encode(text);

describe("NetworkData", () => {
  it("should read the payload as bytes, an ArrayBuffer, text or JSON", () => {
    const data = new NetworkData(utf8('{"type":"move","x":1}'));

    expect(data.bytes()).toStrictEqual(utf8('{"type":"move","x":1}'));
    expect(new Uint8Array(data.arrayBuffer())).toStrictEqual(utf8('{"type":"move","x":1}'));
    expect(data.text()).toBe('{"type":"move","x":1}');
    expect(data.json()).toStrictEqual({ type: "move", x: 1 });
  });

  it("should return a new copy on each read", () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const data = new NetworkData(bytes);

    data.bytes()[0] = 9;
    new Uint8Array(data.arrayBuffer())[1] = 9;
    expect(data.bytes()).toStrictEqual(new Uint8Array([1, 2, 3]));
    expect(data.bytes()).not.toBe(data.bytes());
    expect(bytes).toStrictEqual(new Uint8Array([1, 2, 3]));
  });

  it("should only return the payload of a view into a larger buffer", () => {
    const data = new NetworkData(new Uint8Array([0, 1, 2, 3, 4]).subarray(1, 3));

    expect(data.arrayBuffer().byteLength).toBe(2);
    expect(new Uint8Array(data.arrayBuffer())).toStrictEqual(new Uint8Array([1, 2]));
    expect(data.bytes()).toStrictEqual(new Uint8Array([1, 2]));
  });

  it("should throw when the payload is not JSON", () => {
    expect(() => new NetworkData(utf8("hello")).json()).toThrow(SyntaxError);
  });
});

describe("encodeNetworkPayload", () => {
  it("should send bytes as they are", () => {
    expect(encodeNetworkPayload(new Uint8Array([1, 2]))).toStrictEqual(new Uint8Array([1, 2]));
    expect(encodeNetworkPayload(new Uint8Array([1, 2]).buffer)).toStrictEqual(
      new Uint8Array([1, 2]),
    );
  });

  it("should send only the viewed bytes of any ArrayBufferView", () => {
    const floats = new Float32Array([1.5]);
    expect(encodeNetworkPayload(floats)).toStrictEqual(new Uint8Array(floats.buffer));

    const view = new DataView(new Uint8Array([0, 1, 2, 3]).buffer, 1, 2);
    expect(encodeNetworkPayload(view)).toStrictEqual(new Uint8Array([1, 2]));
  });

  it("should send the bytes of a NetworkData, so a packet can be relayed", () => {
    const packet = new NetworkData(new Uint8Array([7, 8]));
    expect(encodeNetworkPayload(packet)).toStrictEqual(new Uint8Array([7, 8]));
  });

  it("should send a string as UTF-8 text", () => {
    const bytes = encodeNetworkPayload("héllo");

    expect(bytes).toStrictEqual(utf8("héllo"));
    expect(new NetworkData(bytes).text()).toBe("héllo");
  });

  it("should send any other value as JSON", () => {
    const message = { type: "input", key: "up", at: [1, 2], ok: true, none: null };

    expect(new NetworkData(encodeNetworkPayload(message)).json()).toStrictEqual(message);
    expect(new NetworkData(encodeNetworkPayload(42)).json()).toBe(42);
    expect(new NetworkData(encodeNetworkPayload(false)).json()).toBe(false);
    expect(new NetworkData(encodeNetworkPayload(null)).json()).toBe(null);
    expect(new NetworkData(encodeNetworkPayload([1, "a"])).json()).toStrictEqual([1, "a"]);
  });

  it("should throw for values JSON cannot encode", () => {
    expect(() => encodeNetworkPayload(undefined as any)).toThrow(TypeError);
    expect(() => encodeNetworkPayload(() => {})).toThrow(TypeError);
  });
});
