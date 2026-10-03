import type {
  EditorContextApi,
  EditorNetworkStats,
  EditorNetworkTrace,
} from "@nanoforge-dev/editor-lib";

type Transport = EditorNetworkTrace["transport"];

export interface Trace {
  (
    direction: EditorNetworkTrace["direction"],
    transport: Transport,
    data: Uint8Array,
    clientId?: string,
  ): void;
  /** Sends the totals of the windows that ended (call every tick). */
  tick(now?: number): void;
}

const HEAD_BYTES = 16;
/** Most bytes of a packet ever sent to the editor (`networkTrace.maxBytes`). */
const MAX_DATA_BYTES = 2048;
const STATS_WINDOW_MS = 1000;

const hex = (data: Uint8Array, bytes: number): string =>
  Array.from(data.subarray(0, bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");

const emptyTotals = (): EditorNetworkStats["tcp"] => ({
  in: { packets: 0, bytes: 0 },
  out: { packets: 0, bytes: 0 },
});

/**
 * Reports packets to the editor while it asks for network traces:
 * - `network-trace` events for a share of packets (`sampleRate`), at most
 *   `maxPerSecond` per second, with the first `maxBytes` bytes when asked;
 * - `network-stats` events every second with the totals of every packet,
 *   traced or not, and how many were left out of the traces.
 *
 * The options are read on each packet, so an editor can change them while
 * the game runs. While it no longer asks for traces, nothing is sent.
 */
export const createTrace = (editor: EditorContextApi): Trace => {
  let second = 0;
  let sent = 0;
  let windowStart = Date.now();
  let stats = { tcp: emptyTotals(), udp: emptyTotals(), untraced: 0 };

  const tick = (now = Date.now()) => {
    const windowMs = now - windowStart;
    if (windowMs < STATS_WINDOW_MS) return;
    const totals = stats;
    windowStart = now;
    stats = { tcp: emptyTotals(), udp: emptyTotals(), untraced: 0 };
    // Quiet seconds are sent too, so charts fall back to zero.
    if (!editor.welcome?.features.networkTrace) return;
    editor.emit("network-stats", { windowMs, time: now, ...totals });
  };

  const trace = ((direction, transport, data, clientId) => {
    const options = editor.welcome?.features.networkTrace;
    if (!options) return;
    const time = Date.now();
    tick(time);
    const totals = stats[transport][direction];
    totals.packets++;
    totals.bytes += data.byteLength;

    const sampleRate = options.sampleRate ?? 1;
    const current = Math.floor(time / 1000);
    if (current !== second) {
      second = current;
      sent = 0;
    }
    if ((sampleRate < 1 && Math.random() >= sampleRate) || ++sent > (options.maxPerSecond ?? 100)) {
      stats.untraced++;
      return;
    }
    const bytes = Math.min(options.maxBytes ?? 0, MAX_DATA_BYTES);
    editor.emit("network-trace", {
      direction,
      transport,
      ...(clientId !== undefined && { clientId }),
      size: data.byteLength,
      head: hex(data, HEAD_BYTES),
      ...(bytes > 0 && { data: hex(data, bytes) }),
      time,
    });
  }) as Trace;
  trace.tick = tick;
  return trace;
};

interface ClientTransport<C> {
  sendData(channel: C, data: Uint8Array): void;
  getReceivedPackets(channel: C): Uint8Array[];
}

interface ServerTransport<C> {
  sendToEverybody(channel: C, data: Uint8Array): void;
  sendToClient(channel: C, clientId: string, data: Uint8Array): void;
  getReceivedPackets(channel: C): Map<string, Uint8Array[]>;
}

/** Traces the packets a client transport sends and receives. */
export const traceClient = <C>(
  transport: ClientTransport<C>,
  kind: Transport,
  trace: Trace,
): void => {
  const send = transport.sendData.bind(transport);
  const receive = transport.getReceivedPackets.bind(transport);
  transport.sendData = (channel, data) => {
    trace("out", kind, data);
    send(channel, data);
  };
  transport.getReceivedPackets = (channel) => {
    const packets = receive(channel);
    for (const packet of packets) trace("in", kind, packet);
    return packets;
  };
};

/** Traces the packets a server transport sends and receives. */
export const traceServer = <C>(
  transport: ServerTransport<C>,
  kind: Transport,
  trace: Trace,
): void => {
  const everybody = transport.sendToEverybody.bind(transport);
  const client = transport.sendToClient.bind(transport);
  const receive = transport.getReceivedPackets.bind(transport);
  transport.sendToEverybody = (channel, data) => {
    trace("out", kind, data);
    everybody(channel, data);
  };
  transport.sendToClient = (channel, clientId, data) => {
    trace("out", kind, data, clientId);
    client(channel, clientId, data);
  };
  transport.getReceivedPackets = (channel) => {
    const packets = receive(channel);
    for (const [clientId, list] of packets) {
      for (const packet of list) trace("in", kind, packet, clientId);
    }
    return packets;
  };
};
