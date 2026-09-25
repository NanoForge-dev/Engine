import {
  Channel,
  PacketSequencer,
  UNRELIABLE_CHANNELS,
  UNRELIABLE_CHANNEL_OPTIONS,
  type UnreliableChannel,
} from "../shared/channels";
import {
  type ClientSession,
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
 * channels.
 *
 * @remarks
 * Uses a WebSocket signaling channel to perform the SDP/ICE handshake, then
 * opens one RTCDataChannel per unreliable channel, labelled with its
 * {@link Channel} value.  Both use `ordered: false` and `maxRetransmits: 0`
 * for minimal latency.  Each data channel message is one packet;
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
  private readonly _channels = new Map<UnreliableChannel, DataChannelState>();
  private _welcome: WelcomeWait | null = null;

  constructor(
    private _port: number,
    private _ip: string,
    private _wss: boolean,
    private _iceServers: RTCIceServer[] = [],
    private readonly _session: ClientSession = {},
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
   * @throws When the signaling socket fails or closes before the welcome, or
   * when no welcome arrives within `WELCOME_TIMEOUT_MS`.
   */
  public async connect(): Promise<void> {
    const welcome = (this._welcome = waitForWelcome("UDP"));
    try {
      const webSocket: WebSocket = this.connectToServerWebSocket();
      const rtcPeerConnection: RTCPeerConnection = this.getRtcChannelFromIceServer();
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
   * Return `true` when the data channel of `channel` is open.
   *
   * @param channel - Unreliable channel to check.
   */
  public isConnected(channel: UnreliableChannel): boolean {
    return this._channels.get(channel)?.channel.readyState === "open";
  }

  /**
   * Send a payload to the server on an unreliable channel.
   *
   * @param channel - Unreliable channel to send on.
   * @param data - Raw payload bytes.
   */
  public sendData(channel: UnreliableChannel, data: Uint8Array): void {
    const state = this._channels.get(channel);
    if (!state) {
      console.error("UDP not connected");
      return;
    }
    state.channel.send(state.sequencer ? state.sequencer.wrap(data) : new Uint8Array(data));
  }

  /**
   * Return the packets received on an unreliable channel since the last call.
   *
   * @param channel - Unreliable channel to read.
   * @returns Array of packet buffers, in arrival order.
   */
  public getReceivedPackets(channel: UnreliableChannel): Uint8Array[] {
    const state = this._channels.get(channel);
    if (!state) return [];
    const packets = state.packets;
    state.packets = [];
    return packets;
  }

  private connectToServerWebSocket(): WebSocket {
    const serverUrl = buildServerUrl(this._wss, this._ip, this._port, this._session);
    console.log("Try to connect for UDP to " + serverUrl.split("?")[0]);
    const webSocket = new WebSocket(serverUrl);

    webSocket.onerror = (e: Event) => {
      console.error("UDP connection error : WebSocket Error", { cause: e });
      this._welcome?.settle(new Error("UDP connection error", { cause: e }));
    };
    webSocket.onclose = (): void => {
      this._welcome?.settle(new Error("UDP signaling closed before the server welcome"));
    };
    return webSocket;
  }

  private getRtcChannelFromIceServer(): RTCPeerConnection {
    const rtcPeerConnection = new RTCPeerConnection({ iceServers: this._iceServers });
    for (const channel of UNRELIABLE_CHANNELS) {
      this.openDataChannel(rtcPeerConnection, channel);
    }
    return rtcPeerConnection;
  }

  private openDataChannel(rtcPeerConnection: RTCPeerConnection, channel: UnreliableChannel): void {
    const dataChannel = rtcPeerConnection.createDataChannel(channel, UNRELIABLE_CHANNEL_OPTIONS);
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
