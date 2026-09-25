import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ClientRegistry,
  type ConnectionInfo,
  type Transport,
  buildConnectionInfo,
  getSessionToken,
} from "../../src/server/client-registry";

afterEach(() => {
  vi.restoreAllMocks();
});

const connection = (transport: Transport): ConnectionInfo => ({
  transport,
  address: "127.0.0.1",
  port: 1234,
  family: "IPv4",
  params: {},
  connectedAt: 42,
});

describe("ClientRegistry", () => {
  describe("sessions", () => {
    it("should start a new session when no token is presented", () => {
      const registry = new ClientRegistry();
      const session = registry.attach(null, connection("tcp"));

      expect(session).toStrictEqual({ id: expect.any(String), token: expect.any(String) });
      expect(registry.get(session!.id)).toStrictEqual({
        id: session!.id,
        connectedAt: 42,
        transports: { tcp: connection("tcp") },
      });
    });

    it("should give each session a distinct id and token", () => {
      const registry = new ClientRegistry();
      const first = registry.attach(null, connection("tcp"))!;
      const second = registry.attach(null, connection("tcp"))!;

      expect(first.id).not.toBe(second.id);
      expect(first.token).not.toBe(second.token);
      expect(registry.list()).toHaveLength(2);
    });

    it("should link another transport to the session of a valid token", () => {
      const registry = new ClientRegistry();
      const tcp = registry.attach(null, connection("tcp"))!;
      const udp = registry.attach(tcp.token, connection("udp"));

      expect(udp).toStrictEqual(tcp);
      expect(registry.list()).toHaveLength(1);
      expect(Object.keys(registry.get(tcp.id)!.transports)).toStrictEqual(["tcp", "udp"]);
    });

    it("should refuse an unknown token", () => {
      const registry = new ClientRegistry();

      expect(registry.canAttach("forged", "udp")).toBe(false);
      expect(registry.attach("forged", connection("udp"))).toBeNull();
      expect(registry.list()).toStrictEqual([]);
    });

    it("should refuse a transport that is already bound to the session", () => {
      const registry = new ClientRegistry();
      const tcp = registry.attach(null, connection("tcp"))!;

      expect(registry.canAttach(tcp.token, "tcp")).toBe(false);
      expect(registry.attach(tcp.token, connection("tcp"))).toBeNull();
    });

    it("should not change any state when checking a connection", () => {
      const registry = new ClientRegistry();
      const onConnect = vi.fn();
      registry.onConnect(onConnect);

      expect(registry.canAttach(null, "tcp")).toBe(true);
      expect(registry.list()).toStrictEqual([]);
      expect(onConnect).not.toHaveBeenCalled();
    });
  });

  describe("lifecycle callbacks", () => {
    it("should notify a connection once per session", () => {
      const registry = new ClientRegistry();
      const onConnect = vi.fn();
      registry.onConnect(onConnect);

      const tcp = registry.attach(null, connection("tcp"))!;
      registry.attach(tcp.token, connection("udp"));

      expect(onConnect).toHaveBeenCalledTimes(1);
      expect(onConnect).toHaveBeenCalledWith(registry.get(tcp.id));
    });

    it("should notify a disconnection only once the last transport closes", () => {
      const registry = new ClientRegistry();
      const onDisconnect = vi.fn();
      registry.onDisconnect(onDisconnect);
      const tcp = registry.attach(null, connection("tcp"))!;
      registry.attach(tcp.token, connection("udp"));

      registry.detach(tcp.id, "tcp");
      expect(onDisconnect).not.toHaveBeenCalled();

      registry.detach(tcp.id, "udp");
      expect(onDisconnect).toHaveBeenCalledWith(expect.objectContaining({ id: tcp.id }));
      expect(registry.get(tcp.id)).toBeUndefined();
      expect(registry.canAttach(tcp.token, "tcp")).toBe(false);
    });

    it("should ignore detaching a transport that is not attached", () => {
      const registry = new ClientRegistry();
      const onDisconnect = vi.fn();
      registry.onDisconnect(onDisconnect);
      const tcp = registry.attach(null, connection("tcp"))!;

      registry.detach(tcp.id, "udp");
      registry.detach("unknown", "tcp");
      expect(onDisconnect).not.toHaveBeenCalled();
      expect(registry.get(tcp.id)).toBeDefined();
    });

    it("should stop notifying a removed listener", () => {
      const registry = new ClientRegistry();
      const onConnect = vi.fn();
      const unsubscribe = registry.onConnect(onConnect);

      unsubscribe();
      registry.attach(null, connection("tcp"));
      expect(onConnect).not.toHaveBeenCalled();
    });

    it("should keep notifying other listeners when one throws", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const registry = new ClientRegistry();
      const onConnect = vi.fn();
      registry.onConnect(() => {
        throw new Error("boom");
      });
      registry.onConnect(onConnect);

      expect(() => registry.attach(null, connection("tcp"))).not.toThrow();
      expect(onConnect).toHaveBeenCalled();
    });

    it("should forget every session without notifying on clear", () => {
      const registry = new ClientRegistry();
      const onDisconnect = vi.fn();
      registry.onDisconnect(onDisconnect);
      const tcp = registry.attach(null, connection("tcp"))!;

      registry.clear();
      expect(registry.list()).toStrictEqual([]);
      expect(registry.canAttach(tcp.token, "udp")).toBe(false);
      expect(onDisconnect).not.toHaveBeenCalled();
    });
  });
});

describe("getSessionToken", () => {
  it("should read the token from the query string", () => {
    expect(getSessionToken(new Request("http://h/?token=abc"))).toBe("abc");
  });

  it("should return null when no token is presented", () => {
    expect(getSessionToken(new Request("http://h/"))).toBeNull();
  });
});

describe("buildConnectionInfo", () => {
  it("should collect the remote address, headers and params without the token", () => {
    const request = new Request("http://h/?token=abc&name=alice", {
      headers: { "user-agent": "ua", origin: "http://o", authorization: "secret" },
    });
    const server = { requestIP: () => ({ address: "::1", family: "IPv6" as const, port: 99 }) };

    expect(buildConnectionInfo("udp", request, server)).toStrictEqual({
      transport: "udp",
      address: "::1",
      port: 99,
      family: "IPv6",
      userAgent: "ua",
      origin: "http://o",
      params: { name: "alice" },
      connectedAt: expect.any(Number),
    });
  });

  it("should fall back when the remote address is unknown", () => {
    const info = buildConnectionInfo("tcp", new Request("http://h/"), { requestIP: () => null });

    expect(info).toStrictEqual({
      transport: "tcp",
      address: "unknown",
      port: 0,
      family: "unknown",
      params: {},
      connectedAt: expect.any(Number),
    });
  });
});
