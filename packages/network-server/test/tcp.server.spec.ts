import { afterEach, describe, expect, it, vi } from "vitest";

import { TCPServer } from "../src/tcp.server.network";

vi.mock("ws", () => ({
  WebSocketServer: vi.fn(function (this: any) {
    this.on = vi.fn();
  }),
}));

const getWssInstance = async () => {
  const { WebSocketServer } = await import("ws");
  return vi.mocked(WebSocketServer).mock.instances[0] as any;
};

describe("TCPServer", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

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
    it("should start a WebSocketServer on the configured host and port", async () => {
      const { WebSocketServer } = await import("ws");
      const server = new TCPServer(9001, "0.0.0.0", "MAGIC");
      server.listen();
      expect(WebSocketServer).toHaveBeenCalledWith({ port: 9001, host: "0.0.0.0" });
    });

    it("should register a connection handler on the WebSocketServer", async () => {
      const server = new TCPServer(9002, "0.0.0.0", "END");
      server.listen();
      const wss = await getWssInstance();
      expect(wss.on).toHaveBeenCalledWith("connection", expect.any(Function));
    });
  });

  describe("client lifecycle", () => {
    const setupServerWithHandler = async (port: number) => {
      const server = new TCPServer(port, "0.0.0.0", "END");
      server.listen();
      const wss = await getWssInstance();
      const connectionHandler = wss.on.mock.calls[0][1] as (ws: any, req: any) => void;
      return { server, connectionHandler };
    };

    const makeWs = () => {
      const handlers: Record<string, (...args: any[]) => void> = {};
      const ws = {
        binaryType: "",
        on: vi.fn((event: string, cb: (...args: any[]) => void) => {
          handlers[event] = cb;
        }),
        send: vi.fn(),
      };
      return { ws, handlers };
    };

    it("should register a new client on connection", async () => {
      const { server, connectionHandler } = await setupServerWithHandler(9003);
      const { ws } = makeWs();
      connectionHandler(ws, { socket: { remoteAddress: "127.0.0.1" } });
      expect(server.getConnectedClients()).toStrictEqual([0]);
    });

    it("should remove a client on disconnect", async () => {
      const { server, connectionHandler } = await setupServerWithHandler(9004);
      const { ws, handlers } = makeWs();
      connectionHandler(ws, { socket: { remoteAddress: "127.0.0.1" } });
      expect(server.getConnectedClients()).toStrictEqual([0]);
      handlers["close"]?.();
      expect(server.getConnectedClients()).toStrictEqual([]);
    });

    it("should assign incrementing ids to connected clients", async () => {
      const { server, connectionHandler } = await setupServerWithHandler(9005);
      const { ws: ws0 } = makeWs();
      const { ws: ws1 } = makeWs();
      connectionHandler(ws0, { socket: { remoteAddress: "127.0.0.1" } });
      connectionHandler(ws1, { socket: { remoteAddress: "127.0.0.2" } });
      expect(server.getConnectedClients()).toStrictEqual([0, 1]);
    });

    it("should parse a received packet from a connected client", async () => {
      const magicBytes = new TextEncoder().encode("END");
      const payload = new Uint8Array([42, 43]);
      const chunk = new Uint8Array([...payload, ...magicBytes]);

      const { server, connectionHandler } = await setupServerWithHandler(9006);
      const { ws, handlers } = makeWs();
      connectionHandler(ws, { socket: { remoteAddress: "127.0.0.1" } });

      handlers["message"]?.(Buffer.from(chunk));

      const packets = server.getReceivedPackets();
      expect(packets.get(0)).toHaveLength(1);
      expect(packets.get(0)?.[0]).toStrictEqual(payload);
    });
  });
});
