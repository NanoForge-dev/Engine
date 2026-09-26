import type { Server, ServerWebSocket } from "bun";
import { type RTCDataChannel, RTCPeerConnection } from "node-datachannel/polyfill";

import {
  Channel,
  PacketSequencer,
  type UnreliableChannel,
  unreliableChannelFromLabel,
} from "../shared/channels";
import type { WelcomeMessage } from "../shared/session";
import {
  type ClientId,
  type ClientInfo,
  ClientRegistry,
  type ConnectionInfo,
  buildConnectionInfo,
  getSessionToken,
} from "./client-registry";
import { rawDataToUint8Array } from "./utils";

/**
 * Address field of a `typ host` ICE candidate, in both the SDP (`a=candidate:`)
 * and trickle (`candidate:`) forms.
 */
const HOST_CANDIDATE_ADDRESS = /^((?:a=)?candidate:\S+ \d+ \S+ \d+ )(\S+)( \d+ typ host)/gm;

/**
 * Peer connection options, including the libdatachannel settings the polyfill
 * forwards to the native layer but does not declare on `RTCConfiguration`.
 */
type PeerConnectionConfig = RTCConfiguration & {
  enableIceUdpMux?: boolean;
  portRangeBegin?: number;
  portRangeEnd?: number;
};

/**
 * ICE options for {@link UDPServer}, used to make the server reachable from
 * behind a NAT on a predictable port.
 */
export type UDPServerIceConfig = {
  /** STUN and TURN servers used while gathering candidates. */
  iceServers?: RTCIceServer[];
  /** Fixed UDP port shared by every peer through ICE UDP multiplexing. */
  port?: number;
  /** Public address substituted into host candidates before they are sent. */
  advertiseIp?: string;
};

/** Per-connection signaling state attached to each upgraded socket. */
type SignalingSocketData = {
  /** Session identifier, assigned once the socket opens and joins a session. */
  id?: ClientId;
  /** Session token presented in the upgrade request, `null` for a new session. */
  token: string | null;
  /** What is known about the connection, resolved during the upgrade. */
  connection: ConnectionInfo;
  /** Peer connection for this client, created once the socket opens. */
  peerConnection?: RTCPeerConnection;
  /** ICE candidates received before the remote description was set. */
  pendingCandidates: RTCIceCandidateInit[];
};

/** Server side of one client data channel. */
type DataChannelState = {
  channel: RTCDataChannel;
  packets: Uint8Array[];
  /** Only set on `UnreliableOrdered`. */
  sequencer?: PacketSequencer;
};

/**
 * WebRTC server carrying the unreliable channels of every UDP client.
 *
 * @remarks
 * Uses a Bun WebSocket signaling server to complete SDP/ICE handshakes.  Each
 * client then opens one RTCDataChannel per unreliable channel, labelled with
 * its {@link Channel} value.  Each data channel message is one packet;
 * `UnreliableOrdered` packets carry a sequence number and late ones are
 * dropped.  Each signaling client joins a session
 * identified by a {@link ClientId}, shared with the TCP transport when the
 * client presents its session token.  On open, the server sends a `welcome`
 * signaling message carrying the id and token.  The UDP transport is part of
 * the session for as long as its signaling socket is open.
 *
 * Runs on Bun's native WebSocket server (`Bun.serve`) and therefore requires
 * the Bun runtime.
 *
 * Internal: games use it through `UnreliableOrderedServer` and
 * `UnreliableUnorderedServer`, which `NetworkServerLibrary` sets up during
 * `__init`.
 */
export class UDPServer {
  private _clients = new Map<ClientId, Map<UnreliableChannel, DataChannelState>>();
  private readonly _peerConnections = new Set<RTCPeerConnection>();
  private _server: Server<SignalingSocketData> | undefined;

  constructor(
    private _port: number,
    private _host: string,
    private _cert?: string,
    private _key?: string,
    private _ice: UDPServerIceConfig = {},
    private readonly _registry: ClientRegistry = new ClientRegistry(),
  ) {
    if (!this._cert || !this._key) {
      console.warn(
        "No TLS cert/key provided for UDP server, WebSocket connections will be unencrypted",
      );
    }
  }

  /**
   * Start the signaling WebSocket and accept incoming client offers (SDP/ICE).
   *
   * @returns void
   */
  public listen() {
    const cert = this._cert;
    const key = this._key;
    const secure = cert !== undefined && key !== undefined;

    this._server = Bun.serve<SignalingSocketData>({
      port: this._port,
      hostname: this._host,
      ...(cert !== undefined && key !== undefined
        ? { tls: { cert: Bun.file(cert), key: Bun.file(key) } }
        : {}),
      fetch: (request, server) => {
        const token = getSessionToken(request);
        if (!this._registry.canAttach(token, "udp")) {
          return new Response("Invalid session token", { status: 401 });
        }

        const connection = buildConnectionInfo("udp", request, server);
        if (server.upgrade(request, { data: { token, connection, pendingCandidates: [] } })) {
          return undefined;
        }
        return new Response("Expected a WebSocket connection", { status: 426 });
      },
      websocket: {
        open: (webSocket) => {
          const session = this._registry.attach(webSocket.data.token, webSocket.data.connection);
          if (!session) {
            webSocket.close(1008, "Invalid session token");
            return;
          }

          const { id, token } = session;
          webSocket.data.id = id;
          webSocket.send(JSON.stringify({ type: "welcome", id, token } satisfies WelcomeMessage));

          const peerConnection = this.setupRtcSendIceCandidates(webSocket);
          webSocket.data.peerConnection = peerConnection;
          this._peerConnections.add(peerConnection);
          this.receiveClientDataChannel(peerConnection, id, webSocket.data.connection.address);
        },
        message: async (webSocket, message) => {
          const peerConnection = webSocket.data.peerConnection;
          if (!peerConnection) return;

          const data = JSON.parse(
            typeof message === "string" ? message : new TextDecoder().decode(message),
          );

          if (data.type === "offer") {
            await this.receiveClientOffer(peerConnection, data.offer, webSocket);
          }

          if (data.type === "ice" && data.candidate && data.candidate.candidate) {
            if (peerConnection.remoteDescription) {
              await peerConnection.addIceCandidate(data.candidate);
            } else {
              webSocket.data.pendingCandidates.push(data.candidate);
            }
          }
        },
        close: (webSocket) => {
          const peerConnection = webSocket.data.peerConnection;
          if (peerConnection) {
            peerConnection.close();
            this._peerConnections.delete(peerConnection);
          }

          const id = webSocket.data.id;
          if (id === undefined) return;
          this._clients.delete(id);
          this._registry.detach(id, "udp");
        },
      },
    });

    console.log(
      `${secure ? "Secure " : ""}WebSocketServer for UDP listening on ` +
        `${secure ? "wss" : "ws"}://${this._host}:${this._port}`,
    );
  }

  /**
   * Stop the signaling server and close every peer connection.
   *
   * @returns void
   */
  public close() {
    this._server?.stop(true);
    this._server = undefined;
    for (const peerConnection of this._peerConnections) {
      peerConnection.close();
    }
    this._peerConnections.clear();
    this._clients.clear();
  }

  /**
   * Return a snapshot array of client IDs with an active data channel.
   *
   * @param channel - Only list clients with this channel; any channel when omitted.
   * @returns ClientId[]
   */
  public getConnectedClients(channel?: UnreliableChannel): ClientId[] {
    return [...this._clients]
      .filter(([, channels]) => (channel === undefined ? channels.size > 0 : channels.has(channel)))
      .map(([id]) => id);
  }

  /**
   * Return what is known about a client session: its address, user agent,
   * query parameters and attached transports.
   *
   * @param clientId - Client identifier
   * @returns ClientInfo | undefined — `undefined` when the client is gone.
   */
  public getClientInfo(clientId: ClientId): ClientInfo | undefined {
    return this._registry.get(clientId);
  }

  /**
   * Broadcast a packet to every client with an open data channel for `channel`.
   *
   * @param channel - Unreliable channel to send on.
   * @param data - Raw packet bytes (Uint8Array) to send to every client
   * @returns void
   */
  public sendToEverybody(channel: UnreliableChannel, data: Uint8Array) {
    this._clients.forEach((channels) => {
      const state = channels.get(channel);
      if (state) this.send(state, data);
    });
  }

  /**
   * Send a packet to a single client on an unreliable channel.
   *
   * @param channel - Unreliable channel to send on.
   * @param clientId - Client identifier, as listed by `getConnectedClients`
   * @param data - Raw packet bytes (Uint8Array) to send
   * @returns void
   */
  public sendToClient(channel: UnreliableChannel, clientId: ClientId, data: Uint8Array) {
    const state = this._clients.get(clientId)?.get(channel);
    if (!state) {
      console.error(`Unknown client on ${channel}: ${clientId}`);
      return;
    }
    this.send(state, data);
  }

  /**
   * Return the packets each client sent on an unreliable channel since the last call.
   *
   * @param channel - Unreliable channel to read.
   * @returns Map<ClientId, Uint8Array[]>
   */
  public getReceivedPackets(channel: UnreliableChannel): Map<ClientId, Uint8Array[]> {
    const packets = new Map<ClientId, Uint8Array[]>();

    this._clients.forEach((channels, clientId) => {
      const state = channels.get(channel);
      if (!state) return;
      packets.set(clientId, state.packets);
      state.packets = [];
    });
    return packets;
  }

  private send(state: DataChannelState, data: Uint8Array) {
    state.channel.send(state.sequencer ? state.sequencer.wrap(data) : data);
  }

  private async receiveClientOffer(
    peerConnection: RTCPeerConnection,
    offer: RTCSessionDescriptionInit,
    webSocket: ServerWebSocket<SignalingSocketData>,
  ) {
    await peerConnection.setRemoteDescription(offer);

    for (const candidate of webSocket.data.pendingCandidates) {
      await peerConnection.addIceCandidate(candidate);
    }
    webSocket.data.pendingCandidates.length = 0;

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    const localDescription = peerConnection.localDescription;
    webSocket.send(
      JSON.stringify({
        type: "answer",
        answer: localDescription
          ? {
              type: localDescription.type,
              sdp: this.advertiseHostCandidates(localDescription.sdp),
            }
          : null,
      }),
    );
  }

  private setupRtcSendIceCandidates(webSocket: ServerWebSocket<SignalingSocketData>) {
    const peerConnection = new RTCPeerConnection(this.buildPeerConnectionConfig());
    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === "failed") {
        console.error("ICE failed");
        peerConnection.close();
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        webSocket.send(
          JSON.stringify({
            type: "ice",
            candidate: {
              ...event.candidate.toJSON(),
              candidate: this.advertiseHostCandidates(event.candidate.candidate),
            },
          }),
        );
      }
    };
    return peerConnection;
  }

  private buildPeerConnectionConfig(): PeerConnectionConfig {
    const { iceServers = [], port } = this._ice;

    return {
      iceServers,
      ...(port !== undefined
        ? { enableIceUdpMux: true, portRangeBegin: port, portRangeEnd: port }
        : {}),
    };
  }

  private advertiseHostCandidates(value: string): string {
    const advertiseIp = this._ice.advertiseIp;
    if (advertiseIp === undefined) return value;

    return value.replace(HOST_CANDIDATE_ADDRESS, `$1${advertiseIp}$3`);
  }

  private receiveClientDataChannel(
    peerConnection: RTCPeerConnection,
    id: ClientId,
    clientIp: string,
  ) {
    peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      const kind = unreliableChannelFromLabel(channel.label);
      if (kind === undefined) {
        console.error(`UDP data channel with unknown label "${channel.label}" from user: ${id}`);
        channel.close();
        return;
      }

      const state: DataChannelState = {
        channel,
        packets: [],
        ...(kind === Channel.UnreliableOrdered ? { sequencer: new PacketSequencer() } : {}),
      };
      let channels = this._clients.get(id);
      if (!channels) {
        channels = new Map();
        this._clients.set(id, channels);
      }
      channels.set(kind, state);

      /** Drop the entry unless a newer data channel already replaced it. */
      const removeChannel = () => {
        const current = this._clients.get(id);
        if (current?.get(kind) !== state) return;
        current.delete(kind);
        if (current.size === 0) this._clients.delete(id);
      };

      channel.onopen = () => {
        console.log(`UDP ${kind} openned for user: ${id}, ip: ${clientIp}`);
      };

      channel.onmessage = (message) => {
        const packet = rawDataToUint8Array(message.data as ArrayBuffer);
        const payload = state.sequencer ? state.sequencer.unwrap(packet) : packet;
        if (payload) state.packets.push(payload);
      };

      channel.onclose = () => {
        console.log(`UDP ${kind} closed for user: ${id}, ip: ${clientIp}`);
        removeChannel();
      };

      channel.onerror = (event) => {
        console.error(`UDP ${kind} error for user: ${id}, ip: ${clientIp}`, { cause: event });
        removeChannel();
      };
    };
  }
}
