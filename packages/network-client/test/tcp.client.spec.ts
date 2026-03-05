import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TCPClient } from "../src/tcp.client.network";

const makeWsMock = (readyState = 0) => ({
  readyState,
  binaryType: "",
  send: vi.fn(),
  onerror: null as any,
  onopen: null as any,
  onmessage: null as any,
  onclose: null as any,
});

describe("TCPClient", () => {
  let ws: ReturnType<typeof makeWsMock>;

  beforeEach(() => {
    ws = makeWsMock();
    vi.stubGlobal(
      "WebSocket",
      Object.assign(
        vi.fn(function () {
          return ws;
        }),
        { OPEN: 1 },
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("before connect", () => {
    it("should report not connected before connect is called", () => {
      const client = new TCPClient(8080, "127.0.0.1", "END", false);
      expect(client.isConnected()).toBe(false);
    });

    it("should return no received packets before any data arrives", () => {
      const client = new TCPClient(8080, "127.0.0.1", "END", false);
      expect(client.getReceivedPackets()).toStrictEqual([]);
    });

    it("should not throw when sendData is called before connect", () => {
      const client = new TCPClient(8080, "127.0.0.1", "END", false);
      expect(() => client.sendData(new Uint8Array([1, 2, 3]))).not.toThrow();
    });
  });

  describe("after connect", () => {
    it("should create a WebSocket to the correct url on connect", async () => {
      const client = new TCPClient(9090, "192.168.1.1", "MAGIC", false);
      await client.connect();
      expect(vi.mocked(WebSocket)).toHaveBeenCalledWith("ws://192.168.1.1:9090");
    });

    it("should report connected when the WebSocket readyState is OPEN", async () => {
      ws.readyState = 1;
      const client = new TCPClient(8080, "127.0.0.1", "END", false);
      await client.connect();
      expect(client.isConnected()).toBe(true);
    });

    it("should accumulate and parse packets from received message chunks", async () => {
      const magic = new TextEncoder().encode("END");
      const payload = new Uint8Array([10, 20, 30]);
      const packet = new Uint8Array([...payload, ...magic]);

      ws.readyState = 1;
      const client = new TCPClient(8080, "127.0.0.1", "END", false);
      await client.connect();

      ws.onmessage({ data: packet.buffer });

      const received = client.getReceivedPackets();
      expect(received).toHaveLength(1);
      expect(received[0]).toStrictEqual(payload);
    });
  });
});
