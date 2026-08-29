import { buildMagicPacket, parsePacketsFromChunks } from "./utils";

/**
 * Reliable, ordered WebSocket-based client connection to a NanoForge TCP server.
 *
 * @remarks
 * Packets are framed with a configurable magic delimiter so that partial
 * WebSocket frames can be reassembled.  The connection is established by
 * calling `connect` and status can be queried with `isConnected`.
 *
 * Typical usage is through `NetworkClientLibrary` which instantiates and
 * connects this class automatically during `__init`.
 */
export class TCPClient {
  private _channel: WebSocket | null = null;
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
   * Initiate a WebSocket connection to the server.
   *
   * @remarks
   * Connects to `ws[s]://<ip>:<port>`.  Resolves as soon as the connection
   * attempt is dispatched (the socket may not be fully open yet — check
   * `isConnected`).
   */
  public async connect(): Promise<void> {
    this.connectToServerWebSocket();
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
    const serverUrl = `ws${this._wss ? "s" : ""}://${this._ip}:${this._port}`;
    console.log("Try to connect for TCP to " + serverUrl);
    this._channel = new WebSocket(serverUrl);
    this._channel.binaryType = "arraybuffer";

    this._channel.onerror = (e: Event) => {
      console.error("TCP error", { cause: e });
    };

    this._channel.onopen = () => {
      console.log("TCP connected");
    };

    this._channel.onmessage = (ev: MessageEvent) => {
      const chunk = new Uint8Array(ev.data);
      this._chunkedData.push(chunk);
    };

    this._channel.onclose = (): void => console.log("TCP closed");
  }
}
