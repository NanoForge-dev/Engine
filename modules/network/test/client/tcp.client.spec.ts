import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WELCOME_TIMEOUT_MS } from "../../src/client/client-session";
import { TCPClient } from "../../src/client/tcp.client.network";

const welcome = { type: "welcome", id: "client-0", token: "t0k3n" };

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
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  /** Connect, then have the server send its welcome text frame. */
  const connectWelcomed = async (client: TCPClient) => {
    const connecting = client.connect();
    ws.onmessage({ data: JSON.stringify(welcome) });
    await connecting;
  };

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
      await connectWelcomed(client);
      expect(vi.mocked(WebSocket)).toHaveBeenCalledWith("ws://192.168.1.1:9090");
    });

    it("should report connected when the WebSocket readyState is OPEN", async () => {
      ws.readyState = 1;
      const client = new TCPClient(8080, "127.0.0.1", "END", false);
      await connectWelcomed(client);
      expect(client.isConnected()).toBe(true);
    });

    it("should accumulate and parse packets from received message chunks", async () => {
      const magic = new TextEncoder().encode("END");
      const payload = new Uint8Array([10, 20, 30]);
      const packet = new Uint8Array([...payload, ...magic]);

      ws.readyState = 1;
      const client = new TCPClient(8080, "127.0.0.1", "END", false);
      await connectWelcomed(client);

      ws.onmessage({ data: packet.buffer });

      const received = client.getReceivedPackets();
      expect(received).toHaveLength(1);
      expect(received[0]).toStrictEqual(payload);
    });
  });

  describe("session", () => {
    it("should have no client id before the welcome", () => {
      const client = new TCPClient(8080, "127.0.0.1", "END", false);
      expect(client.getClientId()).toBeUndefined();
    });

    it("should store the client id and token from the welcome", async () => {
      const session = {};
      const client = new TCPClient(8080, "127.0.0.1", "END", false, session);
      await connectWelcomed(client);

      expect(client.getClientId()).toBe("client-0");
      expect(session).toStrictEqual({ id: "client-0", token: "t0k3n" });
    });

    it("should not treat control text frames as packets", async () => {
      const client = new TCPClient(8080, "127.0.0.1", "END", false);
      await connectWelcomed(client);
      ws.onmessage({ data: "not json" });

      expect(client.getReceivedPackets()).toStrictEqual([]);
    });

    it("should join an existing session with its token", async () => {
      const client = new TCPClient(9090, "192.168.1.1", "END", true, { id: "x", token: "a b" });
      await connectWelcomed(client);
      expect(vi.mocked(WebSocket)).toHaveBeenCalledWith("wss://192.168.1.1:9090/?token=a%20b");
    });

    it("should reject when the socket closes before the welcome", async () => {
      const client = new TCPClient(8080, "127.0.0.1", "END", false);
      const connecting = client.connect();
      ws.onclose();

      await expect(connecting).rejects.toThrow("TCP closed before the server welcome");
    });

    it("should reject when the socket errors before the welcome", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const client = new TCPClient(8080, "127.0.0.1", "END", false);
      const connecting = client.connect();
      ws.onerror(new Event("error"));

      await expect(connecting).rejects.toThrow("TCP connection error");
    });

    it("should reject, without a pending timer, when the socket cannot be created", async () => {
      vi.useFakeTimers();
      vi.mocked(WebSocket).mockImplementationOnce(function () {
        throw new SyntaxError("bad url");
      });
      const client = new TCPClient(8080, "127.0.0.1", "END", false);

      await expect(client.connect()).rejects.toThrow("bad url");
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should reject when no welcome arrives in time", async () => {
      vi.useFakeTimers();
      const client = new TCPClient(8080, "127.0.0.1", "END", false);
      const connecting = client.connect();
      const assertion = expect(connecting).rejects.toThrow("TCP welcome timed out");

      await vi.advanceTimersByTimeAsync(WELCOME_TIMEOUT_MS);
      await assertion;
    });
  });
});
