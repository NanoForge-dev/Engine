import type { SocketAddress } from "bun";

import { SESSION_TOKEN_PARAM } from "../shared/session";

/** Session-wide client identifier, shared by the TCP and UDP transports. */
export type ClientId = string;

/** Transport a connection was made over. */
export type Transport = "tcp" | "udp";

/** What the server knows about one transport connection of a client. */
export type ConnectionInfo = {
  transport: Transport;
  /** Remote address, as resolved by Bun. */
  address: string;
  /** Remote port. */
  port: number;
  /** Address family (`"IPv4"` or `"IPv6"`). */
  family: string;
  /** `User-Agent` header of the upgrade request. */
  userAgent?: string;
  /** `Origin` header of the upgrade request. */
  origin?: string;
  /** Query parameters of the upgrade request, without the session token. */
  params: Record<string, string>;
  /** Timestamp (ms since epoch) of the upgrade request. */
  connectedAt: number;
};

/** A client session, spanning every transport it is connected with. */
export type ClientInfo = {
  id: ClientId;
  /** Timestamp (ms since epoch) of the first transport connection. */
  connectedAt: number;
  /**
   * Transports currently attached to the session. Live: an entry appears when
   * a transport joins and disappears when it closes.
   */
  transports: Partial<Record<Transport, ConnectionInfo>>;
};

/** Callback notified with a client session. */
export type ClientListener = (info: ClientInfo) => void;

/**
 * Game-facing view of the connected clients, exposed as `ctx.network.clients`.
 *
 * @remarks
 * A client connected over TCP and UDP is a single session with a single
 * {@link ClientId}. A page reload opens a brand-new session.
 */
export interface ClientsApi {
  /**
   * Look up a client session.
   *
   * @param id - Client identifier.
   * @returns The live session info, or `undefined` if the client is gone.
   */
  get(id: ClientId): ClientInfo | undefined;

  /** Return every connected client session. */
  list(): ClientInfo[];

  /**
   * Be notified when a new client session starts, i.e. when its first
   * transport is up. With TCP and UDP, this fires before UDP is linked.
   *
   * @returns A function that removes the listener.
   */
  onConnect(listener: ClientListener): () => void;

  /**
   * Be notified when a client session ends, i.e. when its last transport
   * closes.
   *
   * @returns A function that removes the listener.
   */
  onDisconnect(listener: ClientListener): () => void;
}

type Session = { info: ClientInfo; token: string };

/**
 * Read the session token from an upgrade request, if any.
 *
 * @param request - Upgrade request.
 * @returns The token, or `null` when the client starts a new session.
 */
export const getSessionToken = (request: Request): string | null =>
  new URL(request.url).searchParams.get(SESSION_TOKEN_PARAM);

/**
 * Collect what is known about a connection from its upgrade request.
 *
 * @param transport - Transport the request was made on.
 * @param request - Upgrade request.
 * @param server - Bun server that received the request.
 * @returns The connection info.
 */
export const buildConnectionInfo = (
  transport: Transport,
  request: Request,
  server: { requestIP(request: Request): SocketAddress | null },
): ConnectionInfo => {
  const remote = server.requestIP(request);
  const params = [...new URL(request.url).searchParams].filter(
    ([key]) => key !== SESSION_TOKEN_PARAM,
  );
  const userAgent = request.headers.get("user-agent");
  const origin = request.headers.get("origin");

  return {
    transport,
    address: remote?.address ?? "unknown",
    port: remote?.port ?? 0,
    family: remote?.family ?? "unknown",
    ...(userAgent !== null ? { userAgent } : {}),
    ...(origin !== null ? { origin } : {}),
    params: Object.fromEntries(params),
    connectedAt: Date.now(),
  };
};

const generateToken = (): string =>
  Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

/**
 * Tracks client sessions across the TCP and UDP servers.
 *
 * @remarks
 * The first transport a client opens starts a session and receives its id and
 * a secret token. Presenting that token on another transport links it to the
 * same session. The session ends when its last transport closes.
 */
export class ClientRegistry implements ClientsApi {
  private readonly _sessions = new Map<ClientId, Session>();
  private readonly _tokens = new Map<string, ClientId>();
  private readonly _connectListeners = new Set<ClientListener>();
  private readonly _disconnectListeners = new Set<ClientListener>();

  /**
   * Check whether a connection may join, without changing any state.
   *
   * @param token - Session token presented by the client, or `null` for a new session.
   * @param transport - Transport the connection is made on.
   * @returns `false` when the token is unknown or the transport is already bound.
   */
  public canAttach(token: string | null, transport: Transport): boolean {
    if (token === null) return true;

    const session = this.findSession(token);
    return session !== undefined && session.info.transports[transport] === undefined;
  }

  /**
   * Attach a connection to a new or existing session.
   *
   * @param token - Session token presented by the client, or `null` for a new session.
   * @param connection - Connection to attach.
   * @returns The session id and token, or `null` when {@link canAttach} refuses it.
   */
  public attach(
    token: string | null,
    connection: ConnectionInfo,
  ): { id: ClientId; token: string } | null {
    if (!this.canAttach(token, connection.transport)) return null;

    if (token !== null) {
      const session = this.findSession(token);
      if (!session) return null;
      session.info.transports[connection.transport] = connection;
      return { id: session.info.id, token };
    }

    const session: Session = {
      info: {
        id: crypto.randomUUID(),
        connectedAt: connection.connectedAt,
        transports: { [connection.transport]: connection },
      },
      token: generateToken(),
    };
    this._sessions.set(session.info.id, session);
    this._tokens.set(session.token, session.info.id);
    this.notify(this._connectListeners, session.info);
    return { id: session.info.id, token: session.token };
  }

  /**
   * Detach a transport from its session, ending the session if it was the last one.
   *
   * @param id - Client identifier.
   * @param transport - Transport that closed.
   */
  public detach(id: ClientId, transport: Transport): void {
    const session = this._sessions.get(id);
    if (!session?.info.transports[transport]) return;

    Reflect.deleteProperty(session.info.transports, transport);
    if (Object.keys(session.info.transports).length > 0) return;

    this._sessions.delete(id);
    this._tokens.delete(session.token);
    this.notify(this._disconnectListeners, session.info);
  }

  /** Forget every session without notifying listeners, e.g. on shutdown. */
  public clear(): void {
    this._sessions.clear();
    this._tokens.clear();
  }

  public get(id: ClientId): ClientInfo | undefined {
    return this._sessions.get(id)?.info;
  }

  public list(): ClientInfo[] {
    return [...this._sessions.values()].map((session) => session.info);
  }

  public onConnect(listener: ClientListener): () => void {
    this._connectListeners.add(listener);
    return () => this._connectListeners.delete(listener);
  }

  public onDisconnect(listener: ClientListener): () => void {
    this._disconnectListeners.add(listener);
    return () => this._disconnectListeners.delete(listener);
  }

  private findSession(token: string): Session | undefined {
    const id = this._tokens.get(token);
    return id === undefined ? undefined : this._sessions.get(id);
  }

  private notify(listeners: Set<ClientListener>, info: ClientInfo): void {
    for (const listener of listeners) {
      try {
        listener(info);
      } catch (error) {
        console.error(`Client listener failed for user: ${info.id}`, { cause: error });
      }
    }
  }
}
