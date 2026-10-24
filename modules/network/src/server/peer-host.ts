import { waitForWelcome } from "../client/client-session";
import { CHANNELS, Channel, PacketSequencer, channelFromLabel } from "../shared/channels";
import type { WelcomeMessage } from "../shared/session";
import { type HostSignalMessage, MAX_SIGNAL_BYTES, parseSignal } from "../shared/signaling";
import type { ClientTransport, ServerTransport } from "../shared/transport";
import type { ClientId, ClientRegistry, ConnectionInfo } from "./client-registry";

/** Host side of one WebRTC data channel. */
type DataChannelState = {
  channel: RTCDataChannel;
  packets: Uint8Array[];
  /** Only set on `UnreliableOrdered`. */
  sequencer?: PacketSequencer;
};

/** Host side of one joiner's link. */
type Joiner = {
  /** Id the signaling server knows the joiner by. */
  signalId: string;
  peerConnection: RTCPeerConnection;
  /** ICE candidates received before the offer was applied. */
  pendingCandidates: RTCIceCandidateInit[];
  channels: Map<Channel, DataChannelState>;
  /** Whether its offer was received: later ones are ignored. */
  offered: boolean;
  /** Session id, once every channel is open. */
  id?: ClientId;
};

/** In-memory link between the host's server and its own player. */
type LocalLink = {
  id: ClientId;
  /** Packets the server sent to the local player, per channel. */
  inbox: Map<Channel, Uint8Array[]>;
  /** Packets the local player sent to the server, per channel. */
  outbox: Map<Channel, Uint8Array[]>;
};

// shortcut: the browser does not expose a joiner's address before ICE ends; read getStats() if games need it.
const connectionInfo = (transport: "local" | "peer"): ConnectionInfo => ({
  transport,
  address: "unknown",
  port: 0,
  family: "unknown",
  params: {},
  connectedAt: Date.now(),
});

const take = (queues: Map<Channel, Uint8Array[]>, channel: Channel): Uint8Array[] => {
  const packets = queues.get(channel) ?? [];
  queues.set(channel, []);
  return packets;
};

const push = (queues: Map<Channel, Uint8Array[]>, channel: Channel, data: Uint8Array): void => {
  const queue = queues.get(channel);
  if (queue) queue.push(data);
  else queues.set(channel, [data]);
};

/**
 * Server transport of a peer-to-peer host: answers the WebRTC offers of the
 * joiners its signaling socket forwards, and carries the four channels to
 * each of them over data channels.
 *
 * @remarks
 * Runs in the host's browser, on the native `RTCPeerConnection`.  The answer
 * side is the one of `UDPServer`, without its libdatachannel-only options.  A
 * joiner joins the host's sessions, and is welcomed, once all four of its data
 * channels are open, so `clients.onConnect` means it can be sent to.  It
 * leaves when its signaling socket closes, a data channel closes, or its
 * connection fails.
 *
 * The host's own player is a `"local"` session reached through in-memory
 * queues (see {@link attachLocal}).
 */
export class PeerHost implements ServerTransport<Channel> {
  private _socket: WebSocket | null = null;
  /** Joiners by signaling id, from their first frame on. */
  private readonly _joiners = new Map<string, Joiner>();
  /** Welcomed joiners by session id. */
  private readonly _clients = new Map<ClientId, Joiner>();
  private _local: LocalLink | undefined;
  private _room: string | undefined;

  constructor(
    private readonly _registry: ClientRegistry,
    private readonly _iceServers: RTCIceServer[] = [],
  ) {}

  /** Code joiners use to reach this host; `undefined` once signaling closed. */
  public get room(): string | undefined {
    return this._room;
  }

  /**
   * Open the signaling socket and get a room for this host.
   *
   * @param url - Signaling server URL, without a room.
   * @returns The room code joiners connect with.
   * @throws When the socket fails or closes before the server gives a room.
   */
  public async open(url: string): Promise<string> {
    const wait = waitForWelcome("Signaling");
    let room = "";

    const socket = (this._socket = new WebSocket(url));
    socket.onerror = (event) => wait.settle(new Error("Signaling error", { cause: event }));
    socket.onclose = () => {
      wait.settle(new Error("Signaling closed before giving a room"));
      // The server closed the room: its joiners are told the host left.
      this._room = undefined;
    };
    socket.onmessage = (event: MessageEvent) => {
      const message = typeof event.data === "string" ? parseSignal(event.data) : null;
      if (message?.type === "room" && typeof message.room === "string" && room === "") {
        room = this._room = message.room;
        wait.settle();
      }
      if (typeof message?.from !== "string") return;
      if (message.type === "signal") this.receiveSignal(message.from, message.data);
      // Sooner than WebRTC: Chrome keeps a vanished peer's channels open until ICE gives up.
      if (message.type === "leave") this.removeJoiner(message.from);
    };

    await wait.promise;
    return room;
  }

  /**
   * Register the host's own player as a `"local"` session.
   *
   * @returns Its session id, and the client transport its `NetworkClient` uses:
   * what it sends reaches this server under that id at the next drain, and
   * what this server sends it is read at its own next drain.
   */
  public attachLocal(): { id: ClientId; transport: ClientTransport<Channel> } {
    const { id } = this._registry.attach(null, connectionInfo("local"));
    const local: LocalLink = (this._local = { id, inbox: new Map(), outbox: new Map() });
    return {
      id,
      transport: {
        sendData: (channel, data) => push(local.outbox, channel, data),
        getReceivedPackets: (channel) => take(local.inbox, channel),
        isConnected: () => true,
      },
    };
  }

  /** Close the signaling socket and every joiner's connection, without notifying. */
  public close(): void {
    this._socket?.close();
    this._socket = null;
    this._room = undefined;
    const joiners = [...this._joiners.values()];
    this._joiners.clear();
    this._clients.clear();
    this._local = undefined;
    for (const joiner of joiners) joiner.peerConnection.close();
  }

  public sendToEverybody(channel: Channel, data: Uint8Array): void {
    if (this._local) push(this._local.inbox, channel, data);
    for (const joiner of this._clients.values()) {
      const state = joiner.channels.get(channel);
      if (state) this.send(state, data);
    }
  }

  public sendToClient(channel: Channel, clientId: ClientId, data: Uint8Array): void {
    if (clientId === this._local?.id) {
      push(this._local.inbox, channel, data);
      return;
    }
    const state = this._clients.get(clientId)?.channels.get(channel);
    if (!state) {
      console.error(`Unknown client on ${channel}: ${clientId}`);
      return;
    }
    this.send(state, data);
  }

  public getReceivedPackets(channel: Channel): Map<ClientId, Uint8Array[]> {
    const packets = new Map<ClientId, Uint8Array[]>();
    if (this._local) packets.set(this._local.id, take(this._local.outbox, channel));
    this._clients.forEach((joiner, id) => {
      const state = joiner.channels.get(channel);
      if (!state) return;
      packets.set(id, state.packets);
      state.packets = [];
    });
    return packets;
  }

  public getConnectedClients(channel: Channel): ClientId[] {
    const joiners = [...this._clients]
      .filter(([, joiner]) => joiner.channels.has(channel))
      .map(([id]) => id);
    return this._local ? [this._local.id, ...joiners] : joiners;
  }

  private send(state: DataChannelState, data: Uint8Array): void {
    if (state.channel.readyState !== "open") return;
    state.channel.send(state.sequencer ? state.sequencer.wrap(data) : new Uint8Array(data));
  }

  private signal(signalId: string, data: unknown): void {
    if (this._socket?.readyState !== WebSocket.OPEN) return;
    const frame = JSON.stringify({
      type: "signal",
      to: signalId,
      data,
    } satisfies HostSignalMessage);
    // A crafted offer can inflate the answer past the server's cap, which would drop the host's socket.
    if (new TextEncoder().encode(frame).length > MAX_SIGNAL_BYTES) {
      console.error(`Peer signaling frame too large, dropping joiner: ${signalId}`);
      this.removeJoiner(signalId);
      return;
    }
    this._socket.send(frame);
  }

  /** Handle a frame a joiner sent through the signaling server. */
  private receiveSignal(signalId: string, data: unknown): void {
    if (typeof data !== "object" || data === null) return;
    const message = data as Record<string, unknown>;
    let joiner = this._joiners.get(signalId);
    if (!joiner) {
      // Only an offer costs a peer connection; a joiner sends it before any ICE candidate.
      if (message.type !== "offer") return;
      // Created before any `await`, so ICE candidates sent along with the offer are queued, not lost.
      joiner = this.addJoiner(signalId);
    }

    if (message.type === "offer" && !joiner.offered) {
      joiner.offered = true;
      this.answer(joiner, message.offer as RTCSessionDescriptionInit).catch((error: unknown) => {
        console.error(`Peer offer failed for joiner: ${signalId}`, { cause: error });
        this.removeJoiner(signalId);
      });
    }

    if (message.type === "ice" && typeof message.candidate === "object" && message.candidate) {
      const candidate = message.candidate as RTCIceCandidateInit;
      if (!joiner.peerConnection.remoteDescription) {
        joiner.pendingCandidates.push(candidate);
        return;
      }
      joiner.peerConnection.addIceCandidate(candidate).catch((error: unknown) => {
        console.error(`Peer ICE candidate rejected for joiner: ${signalId}`, { cause: error });
      });
    }
  }

  private addJoiner(signalId: string): Joiner {
    const peerConnection = new RTCPeerConnection({ iceServers: this._iceServers });
    const joiner: Joiner = {
      signalId,
      peerConnection,
      pendingCandidates: [],
      channels: new Map(),
      offered: false,
    };
    this._joiners.set(signalId, joiner);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) this.signal(signalId, { type: "ice", candidate: event.candidate });
    };
    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      if (state === "failed" || state === "closed") this.removeJoiner(signalId);
    };
    peerConnection.ondatachannel = (event) => this.receiveDataChannel(joiner, event.channel);
    return joiner;
  }

  private async answer(joiner: Joiner, offer: RTCSessionDescriptionInit): Promise<void> {
    const { peerConnection } = joiner;
    await peerConnection.setRemoteDescription(offer);

    for (const candidate of joiner.pendingCandidates) {
      await peerConnection.addIceCandidate(candidate);
    }
    joiner.pendingCandidates.length = 0;

    await peerConnection.setLocalDescription(await peerConnection.createAnswer());
    const answer = peerConnection.localDescription;
    this.signal(joiner.signalId, {
      type: "answer",
      answer: answer ? { type: answer.type, sdp: answer.sdp } : null,
    });
  }

  private receiveDataChannel(joiner: Joiner, channel: RTCDataChannel): void {
    const kind = channelFromLabel(channel.label);
    if (kind === undefined || joiner.channels.has(kind)) {
      console.error(`Peer data channel "${channel.label}" refused for joiner: ${joiner.signalId}`);
      channel.close();
      return;
    }

    channel.binaryType = "arraybuffer";
    const state: DataChannelState = {
      channel,
      packets: [],
      ...(kind === Channel.UnreliableOrdered ? { sequencer: new PacketSequencer() } : {}),
    };
    joiner.channels.set(kind, state);

    channel.onopen = () => this.welcomeWhenOpen(joiner);
    channel.onmessage = (event: MessageEvent) => {
      if (!(event.data instanceof ArrayBuffer)) return;
      const packet = new Uint8Array(event.data);
      const payload = state.sequencer ? state.sequencer.unwrap(packet) : packet;
      if (payload) state.packets.push(payload);
    };
    channel.onclose = () => this.removeJoiner(joiner.signalId);
    channel.onerror = (event) => {
      console.error(`Peer ${kind} error for joiner: ${joiner.signalId}`, { cause: event });
    };
    // A channel announced by `ondatachannel` may already be open.
    this.welcomeWhenOpen(joiner);
  }

  /** Join the joiner to the sessions once all four channels are open. */
  private welcomeWhenOpen(joiner: Joiner): void {
    if (joiner.id !== undefined || this._joiners.get(joiner.signalId) !== joiner) return;
    const open = CHANNELS.every((c) => joiner.channels.get(c)?.channel.readyState === "open");
    if (!open) return;

    // Reachable before the connect listeners run, so they can send to it.
    const { id, token } = this._registry.attach(null, connectionInfo("peer"), ({ id }) => {
      joiner.id = id;
      this._clients.set(id, joiner);
    });
    this.signal(joiner.signalId, { type: "welcome", id, token } satisfies WelcomeMessage);
  }

  private removeJoiner(signalId: string): void {
    const joiner = this._joiners.get(signalId);
    if (!joiner) return;
    this._joiners.delete(signalId);
    joiner.peerConnection.close();
    if (joiner.id === undefined) return;
    this._clients.delete(joiner.id);
    this._registry.detach(joiner.id, "peer");
  }
}
