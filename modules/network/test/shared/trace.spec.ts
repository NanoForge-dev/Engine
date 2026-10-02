import type { EditorContextApi } from "@nanoforge-dev/editor-lib";
import { describe, expect, it, vi } from "vitest";

import { createTrace, traceClient, traceServer } from "../../src/shared/trace";

const contextWith = (networkTrace?: {
  sampleRate?: number;
  maxPerSecond?: number;
  maxBytes?: number;
}) => {
  const emitted: unknown[][] = [];
  const ctx = {
    editor: {
      welcome: { protocolVersion: 1, features: networkTrace ? { networkTrace } : {} },
      emit: (...args: unknown[]) => emitted.push(args),
      on: vi.fn(),
      off: vi.fn(),
    },
  } as unknown as { editor: EditorContextApi };
  return { ctx, emitted };
};

describe("network trace", () => {
  it("sends nothing unless the editor asked for it", () => {
    const { ctx, emitted } = contextWith();
    const trace = createTrace(ctx.editor);
    trace("out", "tcp", new Uint8Array([1]));
    trace.tick(Date.now() + 5000);
    expect(emitted).toEqual([]);
  });

  it("traces client packets both ways", () => {
    const { ctx, emitted } = contextWith({});
    const sent: Uint8Array[] = [];
    const transport = {
      sendData: (_channel: number, data: Uint8Array) => void sent.push(data),
      getReceivedPackets: (_channel: number) => [new Uint8Array([0xab, 0xcd])],
    };
    traceClient(transport, "tcp", createTrace(ctx.editor));
    transport.sendData(0, new Uint8Array([1, 2, 3]));
    expect(transport.getReceivedPackets(0)).toHaveLength(1);

    expect(sent).toHaveLength(1);
    expect(emitted.map(([event, trace]) => [event, trace])).toEqual([
      [
        "network-trace",
        expect.objectContaining({ direction: "out", transport: "tcp", size: 3, head: "010203" }),
      ],
      [
        "network-trace",
        expect.objectContaining({ direction: "in", transport: "tcp", size: 2, head: "abcd" }),
      ],
    ]);
  });

  it("tags server packets with their client and rate-limits", () => {
    const { ctx, emitted } = contextWith({ maxPerSecond: 2 });
    const everybody = vi.fn();
    const transport = {
      sendToEverybody: everybody,
      sendToClient: vi.fn(),
      getReceivedPackets: (_channel: number) => new Map([["c7", [new Uint8Array([9])]]]),
    };
    traceServer(transport, "udp", createTrace(ctx.editor));
    transport.getReceivedPackets(0);
    transport.sendToClient(0, "c7", new Uint8Array([1]));
    transport.sendToEverybody(0, new Uint8Array([2]));

    expect(everybody).toHaveBeenCalledOnce();
    expect(emitted.map(([, trace]) => (trace as { clientId?: string }).clientId)).toEqual([
      "c7",
      "c7",
    ]);
  });

  it("sends the first bytes of a payload when asked, within a hard limit", () => {
    const { ctx, emitted } = contextWith({ maxBytes: 4 });
    const trace = createTrace(ctx.editor);
    trace("out", "tcp", new Uint8Array([1, 2, 3, 4, 5, 6]));
    expect(emitted[0]![1]).toMatchObject({ size: 6, head: "010203040506", data: "01020304" });

    const big = contextWith({ maxBytes: 100_000 });
    createTrace(big.ctx.editor)("out", "tcp", new Uint8Array(5000));
    expect((big.emitted[0]![1] as { data: string }).data).toHaveLength(2048 * 2);

    const none = contextWith({});
    createTrace(none.ctx.editor)("out", "tcp", new Uint8Array([1]));
    expect(none.emitted[0]![1]).not.toHaveProperty("data");
  });

  it("counts every packet per second, traced or not", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(10_000);
      const { ctx, emitted } = contextWith({ maxPerSecond: 1 });
      const trace = createTrace(ctx.editor);
      trace("out", "tcp", new Uint8Array(3));
      trace("out", "tcp", new Uint8Array(5));
      trace("in", "udp", new Uint8Array(2));
      vi.setSystemTime(11_000);
      trace.tick();
      const stats = emitted.filter(([event]) => event === "network-stats").map(([, s]) => s);
      expect(stats).toEqual([
        {
          windowMs: 1000,
          time: 11_000,
          tcp: { in: { packets: 0, bytes: 0 }, out: { packets: 2, bytes: 8 } },
          udp: { in: { packets: 1, bytes: 2 }, out: { packets: 0, bytes: 0 } },
          untraced: 2,
        },
      ]);
      expect(emitted.filter(([event]) => event === "network-trace")).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("follows the editor's options while the game runs", () => {
    const { ctx, emitted } = contextWith({});
    const trace = createTrace(ctx.editor);
    const features = ctx.editor.welcome!.features as { networkTrace?: object };
    delete features.networkTrace;
    trace("out", "tcp", new Uint8Array([1]));
    expect(emitted).toEqual([]);
    features.networkTrace = { maxBytes: 1 };
    trace("out", "tcp", new Uint8Array([7, 8]));
    expect(emitted[0]![1]).toMatchObject({ data: "07" });
  });
});
