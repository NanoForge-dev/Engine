import { buildMagicPacket, parsePacketsFromChunks } from "./utils";

/** TCPClient
 * Reliable ordered send/receive of packets to a TCP server
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
   * Initiate a WebSocket connection to the server (e.g. `ws://<ip>:<port>`).
   *
   * @returns Promise<void>
   */
  public async connect(): Promise<void> {
    this.connectToServerWebSocket();
  }

  /**
   * Return `true` when the underlying WebSocket is open.
   *
   * @returns boolean
   */
  public isConnected(): boolean {
    return this._channel !== null && this._channel.readyState === WebSocket.OPEN;
  }

  /**
   * Send a payload to the server.
   *
   * @param data Uint8Array — raw payload bytes.
   * @returns void
   */
  public sendData(data: Uint8Array): void {
    if (!this._channel) {
      console.error("TCP not connected");
      return;
    }
    this._channel.send(buildMagicPacket(data, this._magicData));
  }

  /**
   * Return an array of complete packets that were reassembled from received chunks.
   *
   * @returns Uint8Array[] — array of packet buffers.
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
