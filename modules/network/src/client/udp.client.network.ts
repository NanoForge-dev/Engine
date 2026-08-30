import { buildMagicPacket, parsePacketsFromChunks } from "./utils";

/**
 * Unreliable, unordered WebRTC data-channel client connection to a NanoForge
 * UDP server.
 *
 * @remarks
 * Uses a WebSocket signaling channel to perform the SDP/ICE handshake and then
 * communicates over an RTCDataChannel with `ordered: false` and
 * `maxRetransmits: 0` for minimal latency.
 *
 * Typical usage is through `NetworkClientLibrary` which instantiates and
 * connects this class automatically during `__init`.
 */
export class UDPClient {
  private _channel: RTCDataChannel | null = null;
  private _data: Uint8Array = new Uint8Array();
  private _chunkedData: Uint8Array[] = [];
  private readonly _magicData: Uint8Array = new Uint8Array();

  constructor(
    private _port: number,
    private _ip: string,
    magicValue: string,
    private _wss: boolean,
  ) {
    this._magicData = new TextEncoder().encode(magicValue);
  }

  /**
   * Open the WebSocket signaling channel, create an RTCPeerConnection, and
   * complete the SDP/ICE handshake with the server.
   *
   * @remarks
   * Resolves once the offer has been dispatched.  The data channel may become
   * open shortly after — check `isConnected`.
   */
  public async connect(): Promise<void> {
    const webSocket: WebSocket = this.connectToServerWebSocket();
    const rtcPeerConnection: RTCPeerConnection = this.getRtcChannelFromIceServer();
    this.setupIceConnection(rtcPeerConnection, webSocket);
    await this.sendIceOffer(rtcPeerConnection, webSocket);
  }

  /**
   * Return `true` when the RTCDataChannel is open.
   */
  public isConnected(): boolean {
    return this._channel !== null && this._channel.readyState === "open";
  }

  /**
   * Send a payload on the data channel.
   *
   * @remarks
   * The payload is wrapped in a magic framing packet before being sent.
   *
   * @param data - Raw payload bytes.
   */
  public sendData(data: Uint8Array): void {
    if (!this._channel) {
      console.error("UDP not connected");
      return;
    }
    this._channel.send(buildMagicPacket(data, this._magicData));
  }

  /**
   * Parse and return all complete packets received since the last call.
   *
   * @remarks
   * Partial packets are retained internally and combined with future chunks
   * until they are complete.  Call this method once per frame.
   *
   * @returns Array of complete packet buffers.
   */
  public getReceivedPackets(): Uint8Array[] {
    const { packets, data, chunkedData } = parsePacketsFromChunks(
      this._data,
      this._chunkedData,
      this._magicData,
    );
    this._data = data;
    this._chunkedData = chunkedData;
    return packets;
  }

  private connectToServerWebSocket(): WebSocket {
    const serverUrl = `ws${this._wss ? "s" : ""}://${this._ip}:${this._port}`;
    console.log("Try to connect for UDP to " + serverUrl);
    const webSocket = new WebSocket(serverUrl);

    webSocket.onerror = (e: Event) => {
      throw new Error("UDP connection error : WebSocket Error", { cause: e });
    };
    return webSocket;
  }

  private getRtcChannelFromIceServer(): RTCPeerConnection {
    const rtcPeerConnection = new RTCPeerConnection();
    this._channel = rtcPeerConnection.createDataChannel("game", {
      ordered: false,
      maxRetransmits: 0,
    });

    this._channel.onopen = (): void => {
      console.log("UDP connected");
    };

    this._channel.onmessage = (ev: MessageEvent<any>): void => {
      const chunk = new Uint8Array(ev.data);
      this._chunkedData.push(chunk);
    };

    this._channel.onerror = (ev: RTCErrorEvent): void => {
      this._channel = null;
      console.error("UDP error", { cause: ev });
    };

    this._channel.onclose = (): void => {
      this._channel = null;
    };
    return rtcPeerConnection;
  }

  private setupIceConnection(rtcPeerConnection: RTCPeerConnection, webSocket: WebSocket): void {
    let pendingCandidates: any[] = [];

    rtcPeerConnection.onicecandidate = (ev: RTCPeerConnectionIceEvent): void => {
      if (ev.candidate) {
        webSocket.send(JSON.stringify({ type: "ice", candidate: ev.candidate }));
      }
    };

    webSocket.onmessage = async (ev: MessageEvent<any>): Promise<void> => {
      const msg = JSON.parse(ev.data);

      if (msg.type === "answer" && msg.answer) {
        await rtcPeerConnection.setRemoteDescription(msg.answer);

        for (const c of pendingCandidates) {
          await rtcPeerConnection.addIceCandidate(c);
        }
        pendingCandidates = [];
      }

      if (msg.type === "ice" && msg.candidate) {
        if (rtcPeerConnection.remoteDescription) {
          pendingCandidates.push(msg.candidate);
        } else {
          await rtcPeerConnection.addIceCandidate(msg.candidate);
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
