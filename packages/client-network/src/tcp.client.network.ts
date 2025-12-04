import { buildMagicPacket, parsePacketsFromChunks } from "./utils";

export class TCPClient {
  private _channel: WebSocket | null = null;
  private _data: Uint8Array = new Uint8Array();
  private _chunkedData: Uint8Array[] = [];
  private readonly _magicData: Uint8Array = new Uint8Array();

  constructor(
    private _port: number,
    private _ip: string,
    magicValue: string,
  ) {
    this._magicData = new TextEncoder().encode(magicValue);
  }

  public async connect(): Promise<void> {
    this.connectToServerWebSocket();
  }

  public isConnected(): boolean {
    return this._channel !== null && this._channel.readyState === WebSocket.OPEN;
  }

  public sendData(data: Uint8Array): void {
    if (!this._channel) {
      console.error("TCP not connected");
      return;
    }
    this._channel.send(buildMagicPacket(data, this._magicData));
  }

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
    const serverUrl = `ws://${this._ip}:${this._port}`;
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
