import {
  Channel,
  DATA_CHANNEL_OPTIONS,
  PacketSequencer,
  UNRELIABLE_CHANNELS,
} from "../shared/channels";
import { HOST_LEFT_CODE } from "../shared/signaling";
import {
  type ClientSession,
  WELCOME_TIMEOUT_MS,
  type WelcomeWait,
  applyWelcome,
  buildServerUrl,
  toError,
  waitForWelcome,
} from "./client-session";

/** Client side of one WebRTC data channel. */
type DataChannelState = {
  channel: RTCDataChannel;
  packets: Uint8Array[];
  /** Only set on `UnreliableOrdered`. */
  sequencer?: PacketSequencer;
};

/**
 * WebRTC connection to a NanoForge UDP server, carrying the unreliable
 * channels — or to a peer-to-peer host, carrying all four.
 *
 * @remarks
 * Uses a WebSocket signaling channel to perform the SDP/ICE handshake, then
 * opens one RTCDataChannel per channel it carries, labelled with its
 * {@link Channel} value and set up with `DATA_CHANNEL_OPTIONS`: the
 * unreliable ones use `ordered: false` and `maxRetransmits: 0` for minimal
 * latency.  Each data channel message is one packet;
 * `UnreliableOrdered` packets carry a sequence number and late ones are
 * dropped.
 *
 * The signaling socket also carries the server's `welcome`, which assigns the
 * client id, or links this transport to the TCP session when a token is known.
 *
 * Internal: games use it through `UnreliableOrderedClient` and
 * `UnreliableUnorderedClient`, which `NetworkClientLibrary` sets up during
 * `__init`.
 */
export class UDPClient {
  private readonly _channels = new Map<Channel, DataChannelState>();
  private _welcome: WelcomeWait | null = null;
  private _webSocket: WebSocket | null = null;
  private _peerConnection: RTCPeerConnection | null = null;

  /**
   * @param _carried - Channels to open, the unreliable ones for a dedicated
   * server.
   * @param _params - Extra query parameters of the signaling URL, such as a
   * peer-to-peer `room`.
   */
  constructor(
    private _port: number,
    private _ip: string,
    private _wss: boolean,
    private _iceServers: RTCIceServer[] = [],
    private readonly _session: ClientSession = {},
    private readonly _carried: readonly Channel[] = UNRELIABLE_CHANNELS,
    private readonly _params: Record<string, string> = {},
  ) {}

  /**
   * Open the WebSocket signaling channel, create an RTCPeerConnection, and
   * complete the SDP/ICE handshake with the server.
   *
   * @remarks
   * Joins the current session when it already has a token.  Resolves once the
   * server's welcome is received.  The data channels may become open shortly
   * after — check `isConnected`.
   *
   * @param welcomeTimeoutMs - How long to wait for the welcome.  A peer-to-peer
   * host only welcomes a joiner once its channels are open, so it waits longer.
   * @throws When the signaling socket fails or closes before the welcome, or
   * when no welcome arrives within `welcomeTimeoutMs`.
   */
  public async connect(welcomeTimeoutMs = WELCOME_TIMEOUT_MS): Promise<void> {
    const welcome = (this._welcome = waitForWelcome("UDP", welcomeTimeoutMs));
    try {
      const webSocket = (this._webSocket = this.connectToServerWebSocket());
      const rtcPeerConnection = (this._peerConnection = this.getRtcChannelFromIceServer());
      this.setupIceConnection(rtcPeerConnection, webSocket);
      await this.sendIceOffer(rtcPeerConnection, webSocket);
    } catch (error) {
      welcome.settle(toError(error));
    }
    await welcome.promise;
  }

  /**
   * Return the client id assigned by the server, once welcomed.
   */
  public getClientId(): string | undefined {
    return this._session.id;
  }

  /**
   * Close the signaling socket and the peer connection.
   */
  public close(): void {
    this._webSocket?.close();
    this._peerConnection?.close();
    this._webSocket = null;
    this._peerConnection = null;
    this._channels.clear();
  }

  /**
   * Return `true` when the data channel of `channel` is open.
   *
   * @param channel - Channel to check.
   */
  public isConnected(channel: Channel): boolean {
    return this._channels.get(channel)?.channel.readyState === "open";
  }

  /**
   * Send a payload to the server on a channel.
   *
   * @param channel - Channel to send on.
   * @param data - Raw payload bytes.
   */
  public sendData(channel: Channel, data: Uint8Array): void {
    const state = this._channels.get(channel);
    if (!state) {
      console.error("UDP not connected");
      return;
    }
    state.channel.send(state.sequencer ? state.sequencer.wrap(data) : new Uint8Array(data));
  }

  /**
   * Return the packets received on a channel since the last call.
   *
   * @param channel - Channel to read.
   * @returns Array of packet buffers, in arrival order.
   */
  public getReceivedPackets(channel: Channel): Uint8Array[] {
    const state = this._channels.get(channel);
    if (!state) return [];
    const packets = state.packets;
    state.packets = [];
    return packets;
  }

  private connectToServerWebSocket(): WebSocket {
    const serverUrl = buildServerUrl(this._wss, this._ip, this._port, this._session, this._params);
    console.log("Try to connect for UDP to " + serverUrl.split("?")[0]);
    const webSocket = new WebSocket(serverUrl);

    webSocket.onerror = (e: Event) => {
      console.error("UDP connection error : WebSocket Error", { cause: e });
      this._welcome?.settle(new Error("UDP connection error", { cause: e }));
    };
    webSocket.onclose = (event: CloseEvent): void => {
      this._welcome?.settle(new Error("UDP signaling closed before the server welcome"));
      if (event.code === HOST_LEFT_CODE) this.close();
    };
    return webSocket;
  }

  private getRtcChannelFromIceServer(): RTCPeerConnection {
    const rtcPeerConnection = new RTCPeerConnection({ iceServers: this._iceServers });
    // Chrome keeps the data channels open after the connection failed.
    rtcPeerConnection.onconnectionstatechange = () => {
      const state = rtcPeerConnection.connectionState;
      if (state === "failed" || state === "closed") this.close();
    };
    for (const channel of this._carried) {
      this.openDataChannel(rtcPeerConnection, channel);
    }
    return rtcPeerConnection;
  }

  private openDataChannel(rtcPeerConnection: RTCPeerConnection, channel: Channel): void {
    const dataChannel = rtcPeerConnection.createDataChannel(channel, DATA_CHANNEL_OPTIONS[channel]);
    dataChannel.binaryType = "arraybuffer";
    const state: DataChannelState = {
      channel: dataChannel,
      packets: [],
      ...(channel === Channel.UnreliableOrdered ? { sequencer: new PacketSequencer() } : {}),
    };
    this._channels.set(channel, state);

    /** Drop the entry unless a newer data channel already replaced it. */
    const removeChannel = () => {
      if (this._channels.get(channel) === state) this._channels.delete(channel);
    };

    dataChannel.onopen = (): void => {
      console.log(`UDP ${channel} connected`);
    };

    dataChannel.onmessage = (ev: MessageEvent<any>): void => {
      const packet = new Uint8Array(ev.data);
      const payload = state.sequencer ? state.sequencer.unwrap(packet) : packet;
      if (payload) state.packets.push(payload);
    };

    dataChannel.onerror = (ev: RTCErrorEvent): void => {
      console.error(`UDP ${channel} error`, { cause: ev });
      removeChannel();
    };

    dataChannel.onclose = (): void => {
      removeChannel();
    };
  }

  private setupIceConnection(rtcPeerConnection: RTCPeerConnection, webSocket: WebSocket): void {
    let pendingCandidates: any[] = [];

    rtcPeerConnection.onicecandidate = (ev: RTCPeerConnectionIceEvent): void => {
      // Gathering can outlive the signaling socket, and a closed socket throws on send.
      if (ev.candidate && webSocket.readyState === WebSocket.OPEN) {
        webSocket.send(JSON.stringify({ type: "ice", candidate: ev.candidate }));
      }
    };

    webSocket.onmessage = async (ev: MessageEvent<any>): Promise<void> => {
      const msg = JSON.parse(ev.data);

      if (applyWelcome(this._session, msg)) {
        console.log("UDP joined session: " + this._session.id);
        this._welcome?.settle();
        return;
      }

      if (msg.type === "answer" && msg.answer) {
        await rtcPeerConnection.setRemoteDescription(msg.answer);

        for (const c of pendingCandidates) {
          await rtcPeerConnection.addIceCandidate(c);
        }
        pendingCandidates = [];
      }

      if (msg.type === "ice" && msg.candidate) {
        if (rtcPeerConnection.remoteDescription) {
          await rtcPeerConnection.addIceCandidate(msg.candidate);
        } else {
          pendingCandidates.push(msg.candidate);
        }
      }
    };
  }

  private async sendIceOffer(pc: RTCPeerConnection, webSocket: WebSocket): Promise<void> {
    async function sendOfferWhenConnected() {
      console.log("WebSocket connection for UDP established");
      const offer: RTCSessionDescriptionInit = await pc.createOffer();
      await pc.setLocalDescription(offer);
      webSocket.send(JSON.stringify({ type: "offer", offer }));
    }

    if (webSocket.readyState === WebSocket.OPEN) {
      await sendOfferWhenConnected();
    } else {
      webSocket.onopen = async (): Promise<void> => {
        await sendOfferWhenConnected();
      };
    }
  }
}
