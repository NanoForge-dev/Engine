import { describe, expect, it } from "vitest";

import {
  Channel,
  PacketSequencer,
  decodeReliableFrame,
  encodeReliableFrame,
  unreliableChannelFromLabel,
} from "../../src/shared/channels";

/** Build an `UnreliableOrdered` packet carrying `sequence`. */
const packetWithSequence = (sequence: number, payload: number[]) => {
  const packet = new Uint8Array(4 + payload.length);
  new DataView(packet.buffer).setUint32(0, sequence);
  packet.set(payload, 4);
  return packet;
};

describe("reliable frames", () => {
  it("should round-trip each reliable channel", () => {
    for (const channel of [Channel.ReliableOrdered, Channel.ReliableUnordered] as const) {
      const frame = encodeReliableFrame(channel, new Uint8Array([1, 2]));
      expect(decodeReliableFrame(frame)).toStrictEqual({ channel, data: new Uint8Array([1, 2]) });
    }
  });

  it("should use one tag byte per channel", () => {
    expect(encodeReliableFrame(Channel.ReliableOrdered, new Uint8Array([9]))).toStrictEqual(
      new Uint8Array([0, 9]),
    );
    expect(encodeReliableFrame(Channel.ReliableUnordered, new Uint8Array([9]))).toStrictEqual(
      new Uint8Array([1, 9]),
    );
  });

  it("should carry an empty payload", () => {
    const frame = encodeReliableFrame(Channel.ReliableOrdered, new Uint8Array());
    expect(decodeReliableFrame(frame)?.data).toStrictEqual(new Uint8Array());
  });

  it("should reject an empty frame or an unknown tag", () => {
    expect(decodeReliableFrame(new Uint8Array())).toBeNull();
    expect(decodeReliableFrame(new Uint8Array([2, 1]))).toBeNull();
  });
});

describe("unreliableChannelFromLabel", () => {
  it("should map the label of each unreliable channel", () => {
    expect(unreliableChannelFromLabel("unreliable-ordered")).toBe(Channel.UnreliableOrdered);
    expect(unreliableChannelFromLabel("unreliable-unordered")).toBe(Channel.UnreliableUnordered);
  });

  it("should reject reliable or unknown labels", () => {
    expect(unreliableChannelFromLabel("reliable-ordered")).toBeUndefined();
    expect(unreliableChannelFromLabel("game")).toBeUndefined();
  });
});

describe("PacketSequencer", () => {
  it("should number outgoing packets from zero", () => {
    const sequencer = new PacketSequencer();
    expect(sequencer.wrap(new Uint8Array([5]))).toStrictEqual(packetWithSequence(0, [5]));
    expect(sequencer.wrap(new Uint8Array([6]))).toStrictEqual(packetWithSequence(1, [6]));
  });

  it("should deliver packets that arrive in order", () => {
    const sender = new PacketSequencer();
    const receiver = new PacketSequencer();

    expect(receiver.unwrap(sender.wrap(new Uint8Array([1])))).toStrictEqual(new Uint8Array([1]));
    expect(receiver.unwrap(sender.wrap(new Uint8Array([2])))).toStrictEqual(new Uint8Array([2]));
  });

  it("should deliver the first packet whatever its number", () => {
    expect(new PacketSequencer().unwrap(packetWithSequence(1234, [1]))).toStrictEqual(
      new Uint8Array([1]),
    );
  });

  it("should skip over lost packets", () => {
    const receiver = new PacketSequencer();
    receiver.unwrap(packetWithSequence(0, [0]));
    expect(receiver.unwrap(packetWithSequence(5, [5]))).toStrictEqual(new Uint8Array([5]));
  });

  it("should drop late packets and duplicates", () => {
    const receiver = new PacketSequencer();
    receiver.unwrap(packetWithSequence(5, [5]));

    expect(receiver.unwrap(packetWithSequence(4, [4]))).toBeNull();
    expect(receiver.unwrap(packetWithSequence(5, [5]))).toBeNull();
    expect(receiver.unwrap(packetWithSequence(6, [6]))).toStrictEqual(new Uint8Array([6]));
  });

  it("should keep accepting packets after the counter wraps around", () => {
    const receiver = new PacketSequencer();
    receiver.unwrap(packetWithSequence(0xffffffff, [1]));

    expect(receiver.unwrap(packetWithSequence(0, [2]))).toStrictEqual(new Uint8Array([2]));
    expect(receiver.unwrap(packetWithSequence(0xffffffff, [1]))).toBeNull();
  });

  it("should wrap its outgoing counter around", () => {
    const sequencer = new PacketSequencer();
    (sequencer as unknown as { _next: number })._next = 0xffffffff;

    expect(sequencer.wrap(new Uint8Array())).toStrictEqual(packetWithSequence(0xffffffff, []));
    expect(sequencer.wrap(new Uint8Array())).toStrictEqual(packetWithSequence(0, []));
  });

  it("should drop a packet too short to hold a sequence number", () => {
    expect(new PacketSequencer().unwrap(new Uint8Array([1, 2, 3]))).toBeNull();
  });

  it("should read the header of a packet that is a view into a larger buffer", () => {
    const buffer = new Uint8Array([9, 9, ...packetWithSequence(7, [1])]);
    expect(new PacketSequencer().unwrap(buffer.subarray(2))).toStrictEqual(new Uint8Array([1]));
  });

  it("should number outgoing packets independently from incoming ones", () => {
    const sequencer = new PacketSequencer();
    sequencer.unwrap(packetWithSequence(40, [1]));
    expect(sequencer.wrap(new Uint8Array([2]))).toStrictEqual(packetWithSequence(0, [2]));
  });
});
