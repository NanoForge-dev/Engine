import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ClientRegistry } from "../../src/server/client-registry";
import { TCPServer } from "../../src/server/tcp.server.network";

const serve = vi.fn();
const file = vi.fn((path: string) => ({ path }));

beforeEach(() => {
  let nextId = 0;
  vi.spyOn(crypto, "randomUUID").mockImplementation(
    () => `client-${nextId++}` as ReturnType<typeof crypto.randomUUID>,
  );
  serve.mockImplementation(() => ({ stop: vi.fn() }));
  vi.stubGlobal("Bun", { serve, file });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

/** Options handed to `Bun.serve` by the server under test. */
const getServeOptions = () => serve.mock.calls[0]?.[0];

/**
 * Drive a connection through the same sequence Bun uses: `fetch` performs the
 * upgrade and seeds `ws.data`, then `websocket.open` fires (only when the
 * upgrade was accepted).
 */
const connect = (
  ip = "127.0.0.1",
  { url = "http://localhost:9000/", headers = {} as Record<string, string> } = {},
) => {
  const options = getServeOptions();
  let data: any;

  const server = {
    requestIP: vi.fn(() => ({ address: ip, family: "IPv4", port: 1234 })),
    upgrade: vi.fn((_request: unknown, opts: { data: unknown }) => {
      data = opts.data;
      return true;
    }),
  };

  const response = options.fetch(new Request(url, { headers }), server);
  const webSocket = { data, send: vi.fn(), close: vi.fn() };
  if (data) options.websocket.open(webSocket);
  return { webSocket, options, response };
};

/** Parse the `welcome` text frame sent on open. */
const getWelcome = (webSocket: { send: ReturnType<typeof vi.fn> }) =>
  JSON.parse(webSocket.send.mock.calls.find(([frame]) => typeof frame === "string")?.[0]);

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
      expect(() => server.sendToClient("unknown", new Uint8Array([1, 2, 3]))).not.toThrow();
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

      const response = getServeOptions().fetch(new Request("http://localhost:9009/"), {
        requestIP: () => null,
        upgrade: () => false,
      });
      expect(response.status).toBe(426);
    });

    it("should not start a session for a request that cannot be upgraded", () => {
      const registry = new ClientRegistry();
      const onConnect = vi.fn();
      registry.onConnect(onConnect);
      const server = new TCPServer(9012, "0.0.0.0", "END", undefined, undefined, registry);
      server.listen();

      getServeOptions().fetch(new Request("http://localhost:9012/"), {
        requestIP: () => null,
        upgrade: () => false,
      });
      expect(onConnect).not.toHaveBeenCalled();
      expect(registry.list()).toStrictEqual([]);
    });

    it("should reject an upgrade presenting an unknown session token", () => {
      const server = new TCPServer(9013, "0.0.0.0", "END");
      server.listen();

      const { response } = connect("127.0.0.1", { url: "http://localhost:9013/?token=forged" });
      expect(response.status).toBe(401);
      expect(server.getConnectedClients()).toStrictEqual([]);
    });
  });

  describe("client lifecycle", () => {
    it("should register a new client on connection", () => {
      const server = new TCPServer(9003, "0.0.0.0", "END");
      server.listen();
      connect();
      expect(server.getConnectedClients()).toStrictEqual(["client-0"]);
    });

    it("should remove a client on disconnect", () => {
      const server = new TCPServer(9004, "0.0.0.0", "END");
      server.listen();
      const { webSocket, options } = connect();
      expect(server.getConnectedClients()).toStrictEqual(["client-0"]);

      options.websocket.close(webSocket);
      expect(server.getConnectedClients()).toStrictEqual([]);
    });

    it("should send a welcome text frame with the client id and session token", () => {
      const server = new TCPServer(9014, "0.0.0.0", "END");
      server.listen();
      const { webSocket } = connect();

      const welcome = getWelcome(webSocket);
      expect(welcome).toStrictEqual({
        type: "welcome",
        id: "client-0",
        token: expect.stringMatching(/^[0-9a-f]{64}$/),
      });
    });

    it("should refuse a second TCP connection for the same session", () => {
      const server = new TCPServer(9015, "0.0.0.0", "END");
      server.listen();
      const { webSocket } = connect();
      const { token } = getWelcome(webSocket);

      const { response } = connect("127.0.0.1", { url: `http://localhost:9015/?token=${token}` });
      expect(response.status).toBe(401);
    });

    it("should expose what is known about a connected client", () => {
      const server = new TCPServer(9016, "0.0.0.0", "END");
      server.listen();
      connect("10.0.0.5", {
        url: "http://localhost:9016/?name=alice",
        headers: { "user-agent": "test-agent", origin: "http://game.local", cookie: "secret" },
      });

      expect(server.getClientInfo("client-0")).toStrictEqual({
        id: "client-0",
        connectedAt: expect.any(Number),
        transports: {
          tcp: {
            transport: "tcp",
            address: "10.0.0.5",
            port: 1234,
            family: "IPv4",
            userAgent: "test-agent",
            origin: "http://game.local",
            params: { name: "alice" },
            connectedAt: expect.any(Number),
          },
        },
      });
    });

    it("should end the session when the socket closes", () => {
      const registry = new ClientRegistry();
      const onDisconnect = vi.fn();
      registry.onDisconnect(onDisconnect);
      const server = new TCPServer(9017, "0.0.0.0", "END", undefined, undefined, registry);
      server.listen();
      const { webSocket, options } = connect();

      options.websocket.close(webSocket);
      expect(onDisconnect).toHaveBeenCalledWith(expect.objectContaining({ id: "client-0" }));
      expect(server.getClientInfo("client-0")).toBeUndefined();
    });

    it("should assign distinct ids to connected clients", () => {
      const server = new TCPServer(9005, "0.0.0.0", "END");
      server.listen();
      connect("127.0.0.1");
      connect("127.0.0.2");
      expect(server.getConnectedClients()).toStrictEqual(["client-0", "client-1"]);
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
      expect(packets.get("client-0")).toHaveLength(1);
      expect(packets.get("client-0")?.[0]).toStrictEqual(payload);
    });

    it("should ignore a text frame instead of throwing", () => {
      const server = new TCPServer(9010, "0.0.0.0", "END");
      server.listen();
      const { webSocket, options } = connect();

      expect(() => options.websocket.message(webSocket, "not binary")).not.toThrow();
      expect(server.getReceivedPackets().get("client-0")).toStrictEqual([]);
    });

    it("should send framed packets to a connected client", () => {
      const server = new TCPServer(9011, "0.0.0.0", "END");
      server.listen();
      const { webSocket } = connect();

      server.sendToClient("client-0", new Uint8Array([1, 2]));
      expect(webSocket.send).toHaveBeenCalledWith(
        new Uint8Array([1, 2, ...new TextEncoder().encode("END")]),
      );
    });
  });
});
