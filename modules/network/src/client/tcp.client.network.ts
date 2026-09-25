import { buildMagicPacket, parsePacketsFromChunks } from "../shared/utils";
import {
  type ClientSession,
  type WelcomeWait,
  applyWelcome,
  buildServerUrl,
  toError,
  waitForWelcome,
} from "./client-session";

/**
 * Reliable, ordered WebSocket-based client connection to a NanoForge TCP server.
 *
 * @remarks
 * Packets are framed with a configurable magic delimiter so that partial
 * WebSocket frames can be reassembled.  The connection is established by
 * calling `connect` and status can be queried with `isConnected`.
 *
 * Text frames are reserved for control messages: the server's `welcome`
 * assigns the client id and the token that links the UDP transport to the
 * same session.
 *
 * Typical usage is through `NetworkClientLibrary` which instantiates and
 * connects this class automatically during `__init`.
 */
export class TCPClient {
  private _channel: WebSocket | null = null;
  private _data: Uint8Array = new Uint8Array();
  private _chunkedData: Uint8Array[] = [];
  private readonly _magicData: Uint8Array = new Uint8Array();
  private _welcome: WelcomeWait | null = null;

  constructor(
    private _port: number,
    private _ip: string,
    magicValue: string,
    private _wss: boolean,
    private readonly _session: ClientSession = {},
  ) {
    this._magicData = new TextEncoder().encode(magicValue);
  }

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
   * Send a payload to the server.
   *
   * @remarks
   * The payload is wrapped in a magic framing packet before being sent.
   *
   * @param data - Raw payload bytes.
   */
  public sendData(data: Uint8Array): void {
    if (!this._channel) {
      console.error("TCP not connected");
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
      const chunk = new Uint8Array(ev.data);
      this._chunkedData.push(chunk);
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
