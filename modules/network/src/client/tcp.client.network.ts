import {
  RELIABLE_CHANNELS,
  type ReliableChannel,
  decodeReliableFrame,
  encodeReliableFrame,
} from "../shared/channels";
import {
  type ClientSession,
  type WelcomeWait,
  applyWelcome,
  buildServerUrl,
  toError,
  waitForWelcome,
} from "./client-session";

/**
 * WebSocket connection to a NanoForge TCP server, carrying the reliable
 * channels.
 *
 * @remarks
 * Each binary frame is one packet, prefixed with the tag of its reliable
 * channel.  The connection is established by calling `connect` and status
 * can be queried with `isConnected`.
 *
 * Text frames are reserved for control messages: the server's `welcome`
 * assigns the client id and the token that links the UDP transport to the
 * same session.
 *
 * Internal: games use it through `ReliableOrderedClient` and
 * `ReliableUnorderedClient`, which `NetworkClientLibrary` sets up during
 * `__init`.
 */
export class TCPClient {
  private _channel: WebSocket | null = null;
  private readonly _packets = new Map<ReliableChannel, Uint8Array[]>(
    RELIABLE_CHANNELS.map((channel) => [channel, []]),
  );
  private _welcome: WelcomeWait | null = null;

  constructor(
    private _port: number,
    private _ip: string,
    private _wss: boolean,
    private readonly _session: ClientSession = {},
  ) {}

  /**
   * Initiate a WebSocket connection to the server.
   *
   * @remarks
   * Connects to `ws[s]://<ip>:<port>`, joining the current session when it
   * already has a token.  Resolves once the server's welcome is received.
   *
   * @throws When the socket fails or closes before the welcome, or when no
   * welcome arrives within `WELCOME_TIMEOUT_MS`.
   */
  public async connect(): Promise<void> {
    const welcome = (this._welcome = waitForWelcome("TCP"));
    try {
      this.connectToServerWebSocket();
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
   * Return `true` when the underlying WebSocket is open.
   */
  public isConnected(): boolean {
    return this._channel !== null && this._channel.readyState === WebSocket.OPEN;
  }

  /**
   * Send a payload to the server on a reliable channel.
   *
   * @param channel - Reliable channel to send on.
   * @param data - Raw payload bytes.
   */
  public sendData(channel: ReliableChannel, data: Uint8Array): void {
    if (!this._channel) {
      console.error("TCP not connected");
      return;
    }
    this._channel.send(encodeReliableFrame(channel, data));
  }

  /**
   * Return the packets received on a reliable channel since the last call.
   *
   * @param channel - Reliable channel to read.
   * @returns Array of packet buffers, oldest first.
   */
  public getReceivedPackets(channel: ReliableChannel): Uint8Array[] {
    const packets = this._packets.get(channel) ?? [];
    this._packets.set(channel, []);
    return packets;
  }

  private connectToServerWebSocket() {
    const serverUrl = buildServerUrl(this._wss, this._ip, this._port, this._session);
    console.log("Try to connect for TCP to " + serverUrl.split("?")[0]);
    this._channel = new WebSocket(serverUrl);
    this._channel.binaryType = "arraybuffer";

    this._channel.onerror = (e: Event) => {
      console.error("TCP error", { cause: e });
      this._welcome?.settle(new Error("TCP connection error", { cause: e }));
    };

    this._channel.onopen = () => {
      console.log("TCP connected");
    };

    this._channel.onmessage = (ev: MessageEvent) => {
      if (typeof ev.data === "string") {
        this.handleControlMessage(ev.data);
        return;
      }
      const frame = decodeReliableFrame(new Uint8Array(ev.data));
      if (!frame) {
        console.error("TCP received a frame on an unknown channel");
        return;
      }
      this._packets.get(frame.channel)?.push(frame.data);
    };

    this._channel.onclose = (): void => {
      console.log("TCP closed");
      this._welcome?.settle(new Error("TCP closed before the server welcome"));
    };
  }

  private handleControlMessage(raw: string) {
    let message: unknown;
    try {
      message = JSON.parse(raw);
    } catch {
      console.error("TCP received an invalid control message");
      return;
    }

    if (applyWelcome(this._session, message)) {
      console.log("TCP joined session: " + this._session.id);
      this._welcome?.settle();
    }
  }
}
