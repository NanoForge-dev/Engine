import type { Context } from "@nanoforge-dev/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Channel } from "../../src/shared/channels";
import { NetworkData } from "../../src/shared/network-data";
import {
  PacketDispatcher,
  type TypedPacket,
  decodePacket,
  definePacket,
  encodePacket,
  encodeTypedPacket,
  sortPackets,
} from "../../src/shared/packet";

const utf8 = (text: string) => new TextEncoder().encode(text);

type Info = { channel: Channel };
const ctx = {} as Context;
const info: Info = { channel: Channel.ReliableOrdered };

const Move = definePacket<{ x: number }>("move", {
  channel: Channel.UnreliableOrdered,
  validate: (data): data is { x: number } => typeof (data as { x?: unknown }).x === "number",
});
const Play = definePacket("play");

/** A typed packet as received, its payload being `value` as JSON. */
const received = (name: string, value: unknown): TypedPacket<Info> => ({
  name,
  data: utf8(JSON.stringify(value)),
  info,
});

describe("definePacket", () => {
  it("should default to ReliableOrdered", () => {
    expect(Play).toStrictEqual({
      name: "play",
      channel: Channel.ReliableOrdered,
      validate: undefined,
    });
    expect(Move.channel).toBe(Channel.UnreliableOrdered);
  });

  it("should reject an empty name or one longer than 255 bytes", () => {
    expect(() => definePacket("")).toThrow("1 to 255");
    expect(() => definePacket("é".repeat(128))).toThrow("1 to 255");
    expect(() => definePacket("a".repeat(255))).not.toThrow();
  });
});

describe("packet header", () => {
  it("should round-trip a typed packet", () => {
    const packet = encodeTypedPacket(Move, { x: 1 });

    expect(packet).toStrictEqual(new Uint8Array([4, ...utf8("move"), ...utf8('{"x":1}')]));
    expect(decodePacket(packet)).toStrictEqual({ name: "move", data: utf8('{"x":1}') });
  });

  it("should mark sendData packets with a zero length", () => {
    const packet = encodePacket(null, new Uint8Array([7]));

    expect(packet).toStrictEqual(new Uint8Array([0, 7]));
    expect(decodePacket(packet)).toStrictEqual({ name: null, data: new Uint8Array([7]) });
  });

  it("should reject empty and truncated packets", () => {
    expect(decodePacket(new Uint8Array())).toBeNull();
    expect(decodePacket(new Uint8Array([4, 1, 2]))).toBeNull();
  });

  it("should refuse a payload JSON cannot encode", () => {
    expect(() => encodeTypedPacket(Play as never, undefined as never)).toThrow(TypeError);
  });

  it("should sort raw and typed packets, dropping broken ones", () => {
    const raw: NetworkData[] = [];
    const typed: TypedPacket<Info>[] = [];

    sortPackets(
      [encodePacket(null, new Uint8Array([1])), new Uint8Array(), encodeTypedPacket(Play, null)],
      info,
      raw,
      typed,
    );
    expect(raw).toStrictEqual([new NetworkData(new Uint8Array([1]))]);
    expect(typed).toStrictEqual([{ name: "play", data: utf8("null"), info }]);
  });
});

describe("PacketDispatcher", () => {
  let warn: ReturnType<typeof vi.spyOn>;
  let error: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    error = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should call every listener of a type, in order, with the context", () => {
    const dispatcher = new PacketDispatcher<Info>();
    const calls: unknown[] = [];
    dispatcher.on(Move, (move, packetInfo) => calls.push(["a", move, packetInfo]));
    dispatcher.on(Move, (move) => calls.push(["b", move]));

    dispatcher.dispatch([received("move", { x: 1 }), received("move", { x: 2 })], ctx);
    expect(calls).toStrictEqual([
      ["a", { x: 1 }, { ...info, ctx }],
      ["b", { x: 1 }],
      ["a", { x: 2 }, { ...info, ctx }],
      ["b", { x: 2 }],
    ]);
  });

  it("should stop calling a removed listener", () => {
    const dispatcher = new PacketDispatcher<Info>();
    const listener = vi.fn();
    const off = dispatcher.on(Play, listener);

    off();
    dispatcher.dispatch([received("play", null)], ctx);
    expect(listener).not.toHaveBeenCalled();
  });

  it("should keep calling listeners when one throws or rejects", async () => {
    const dispatcher = new PacketDispatcher<Info>();
    const listener = vi.fn();
    dispatcher.on(Play, () => {
      throw new Error("boom");
    });
    dispatcher.on(Play, async () => {
      throw new Error("async boom");
    });
    dispatcher.on(Play, listener);

    dispatcher.dispatch([received("play", null)], ctx);
    await Promise.resolve();
    expect(listener).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledTimes(2);
  });

  it("should return the packets of the current tick only", () => {
    const dispatcher = new PacketDispatcher<Info>();

    dispatcher.dispatch([received("move", { x: 1 }), received("play", null)], ctx);
    expect(dispatcher.read(Move)).toStrictEqual([{ ...info, data: { x: 1 } }]);
    expect(dispatcher.read(Move)).toStrictEqual([{ ...info, data: { x: 1 } }]);

    dispatcher.dispatch([], ctx);
    expect(dispatcher.read(Move)).toStrictEqual([]);
  });

  it("should drop invalid payloads and bad JSON, for listeners and readers", () => {
    const dispatcher = new PacketDispatcher<Info>();
    const listener = vi.fn();
    dispatcher.on(Move, listener);

    dispatcher.dispatch(
      [received("move", { x: "1" }), { name: "move", data: utf8("{"), info }],
      ctx,
    );
    expect(listener).not.toHaveBeenCalled();
    expect(dispatcher.read(Move)).toStrictEqual([]);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("should treat a throwing validate as invalid", () => {
    const dispatcher = new PacketDispatcher<Info>();
    const Strict = definePacket<{ x: number }>("strict", {
      validate: (data): data is { x: number } => (data as { x: number }).x.toFixed() !== "",
    });

    dispatcher.dispatch([received("strict", null)], ctx);
    expect(dispatcher.read(Strict)).toStrictEqual([]);
  });

  it("should reject a definition of a known name with another channel or validate", () => {
    const dispatcher = new PacketDispatcher<Info>();
    dispatcher.on(Move, () => {});

    expect(() => dispatcher.on(definePacket("move"), () => {})).toThrow("defined twice");
    expect(() =>
      dispatcher.read(definePacket("move", { channel: Channel.UnreliableOrdered })),
    ).toThrow("defined twice");
    expect(() =>
      dispatcher.read(definePacket("move", { channel: Move.channel, validate: Move.validate })),
    ).not.toThrow();
  });

  it("should warn once, a tick late, about types nobody listens to or reads", () => {
    const dispatcher = new PacketDispatcher<Info>();

    dispatcher.dispatch([received("move", { x: 1 }), received("ghost", null)], ctx);
    expect(warn).not.toHaveBeenCalled();
    dispatcher.read(Move); // read after the dispatch, like a system

    dispatcher.dispatch([received("ghost", null)], ctx);
    expect(warn).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"ghost"'));

    dispatcher.dispatch([], ctx);
    expect(warn).toHaveBeenCalledOnce();
  });

  it("should stop warning about unknown types past 100 names", () => {
    const dispatcher = new PacketDispatcher<Info>();
    const names = Array.from({ length: 150 }, (_, i) => received(`ghost-${i}`, null));

    dispatcher.dispatch(names, ctx);
    dispatcher.dispatch(names, ctx);
    dispatcher.dispatch([], ctx);
    expect(warn).toHaveBeenCalledTimes(100);
  });
});
