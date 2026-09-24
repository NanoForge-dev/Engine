import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TCPServer } from "../../src/server/tcp.server.network";

const serve = vi.fn();
const file = vi.fn((path: string) => ({ path }));

beforeEach(() => {
  serve.mockImplementation(() => ({ stop: vi.fn() }));
  vi.stubGlobal("Bun", { serve, file });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

/** Options handed to `Bun.serve` by the server under test. */
const getServeOptions = () => serve.mock.calls[0]?.[0];

/**
 * Drive a connection through the same sequence Bun uses: `fetch` performs the
 * upgrade and seeds `ws.data`, then `websocket.open` fires.
 */
const connect = (ip = "127.0.0.1") => {
  const options = getServeOptions();
  let data: any;

  const server = {
    requestIP: vi.fn(() => ({ address: ip, family: "IPv4", port: 1234 })),
    upgrade: vi.fn((_request: unknown, opts: { data: unknown }) => {
      data = opts.data;
      return true;
    }),
  };

  options.fetch({}, server);
  const webSocket = { data, send: vi.fn() };
  options.websocket.open(webSocket);
  return { webSocket, options };
};

describe("TCPServer", () => {
  describe("before listen", () => {
    it("should have no connected clients initially", () => {
      const server = new TCPServer(9000, "127.0.0.1", "END");
      expect(server.getConnectedClients()).toStrictEqual([]);
    });

    it("should return an empty packets map when no clients are connected", () => {
      const server = new TCPServer(9000, "127.0.0.1", "END");
      expect(server.getReceivedPackets()).toStrictEqual(new Map());
    });

    it("should not throw when sendToClient is called with an unknown clientId", () => {
      const server = new TCPServer(9000, "127.0.0.1", "END");
      expect(() => server.sendToClient(99, new Uint8Array([1, 2, 3]))).not.toThrow();
    });

    it("should not throw when sendToEverybody is called with no clients", () => {
      const server = new TCPServer(9000, "127.0.0.1", "END");
      expect(() => server.sendToEverybody(new Uint8Array([1, 2, 3]))).not.toThrow();
    });
  });

  describe("after listen", () => {
    it("should start a Bun server on the configured host and port", () => {
      const server = new TCPServer(9001, "0.0.0.0", "MAGIC");
      server.listen();
      expect(serve).toHaveBeenCalledWith(
        expect.objectContaining({ port: 9001, hostname: "0.0.0.0" }),
      );
    });

    it("should register the websocket lifecycle handlers", () => {
      const server = new TCPServer(9002, "0.0.0.0", "END");
      server.listen();
      expect(getServeOptions().websocket).toEqual({
        open: expect.any(Function),
        message: expect.any(Function),
        close: expect.any(Function),
      });
    });

    it("should serve without TLS when no cert and key are provided", () => {
      const server = new TCPServer(9007, "0.0.0.0", "END");
      server.listen();
      expect(getServeOptions().tls).toBeUndefined();
    });

    it("should serve over TLS when a cert and key are provided", () => {
      const server = new TCPServer(9008, "0.0.0.0", "END", "/tmp/cert.pem", "/tmp/key.pem");
      server.listen();
      expect(getServeOptions().tls).toEqual({
        cert: { path: "/tmp/cert.pem" },
        key: { path: "/tmp/key.pem" },
      });
      expect(file).toHaveBeenCalledWith("/tmp/cert.pem");
      expect(file).toHaveBeenCalledWith("/tmp/key.pem");
    });

    it("should reject a plain HTTP request that cannot be upgraded", () => {
      const server = new TCPServer(9009, "0.0.0.0", "END");
      server.listen();

      const response = getServeOptions().fetch({}, { requestIP: () => null, upgrade: () => false });
      expect(response.status).toBe(426);
    });
  });

  describe("client lifecycle", () => {
    it("should register a new client on connection", () => {
      const server = new TCPServer(9003, "0.0.0.0", "END");
      server.listen();
      connect();
      expect(server.getConnectedClients()).toStrictEqual([0]);
    });

    it("should remove a client on disconnect", () => {
      const server = new TCPServer(9004, "0.0.0.0", "END");
      server.listen();
      const { webSocket, options } = connect();
      expect(server.getConnectedClients()).toStrictEqual([0]);

      options.websocket.close(webSocket);
      expect(server.getConnectedClients()).toStrictEqual([]);
    });

    it("should assign incrementing ids to connected clients", () => {
      const server = new TCPServer(9005, "0.0.0.0", "END");
      server.listen();
      connect("127.0.0.1");
      connect("127.0.0.2");
      expect(server.getConnectedClients()).toStrictEqual([0, 1]);
    });

    it("should parse a received packet from a connected client", () => {
      const magicBytes = new TextEncoder().encode("END");
      const payload = new Uint8Array([42, 43]);
      const chunk = new Uint8Array([...payload, ...magicBytes]);

      const server = new TCPServer(9006, "0.0.0.0", "END");
      server.listen();
      const { webSocket, options } = connect();

      options.websocket.message(webSocket, Buffer.from(chunk));

      const packets = server.getReceivedPackets();
      expect(packets.get(0)).toHaveLength(1);
      expect(packets.get(0)?.[0]).toStrictEqual(payload);
    });

    it("should ignore a text frame instead of throwing", () => {
      const server = new TCPServer(9010, "0.0.0.0", "END");
      server.listen();
      const { webSocket, options } = connect();

      expect(() => options.websocket.message(webSocket, "not binary")).not.toThrow();
      expect(server.getReceivedPackets().get(0)).toStrictEqual([]);
    });

    it("should send framed packets to a connected client", () => {
      const server = new TCPServer(9011, "0.0.0.0", "END");
      server.listen();
      const { webSocket } = connect();

      server.sendToClient(0, new Uint8Array([1, 2]));
      expect(webSocket.send).toHaveBeenCalledWith(
        new Uint8Array([1, 2, ...new TextEncoder().encode("END")]),
      );
    });
  });
});
