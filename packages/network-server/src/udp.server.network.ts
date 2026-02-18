import { createServer } from "https";
import { RTCPeerConnection } from "wrtc";
import { type RawData, type WebSocket, WebSocketServer } from "ws";

import { buildMagicPacket, parsePacketsFromChunks } from "./utils";

/** UDPServer
 * Fast but less reliable unordered send/receive to multiple UDP clients
 */
export class UDPServer {
  private _clients = new Map<
    number,
    { channel: RTCDataChannel; data: Uint8Array; chunkedData: Uint8Array[] }
  >();
  private _nextClientId: number = 0;
  private readonly _magicData = new Uint8Array();
  private _httpsServer: ReturnType<typeof createServer> | undefined;

  constructor(
    private _port: number,
    private _host: string,
    magicValue: string,
    private _cert: string | undefined = undefined,
    private _key: string | undefined = undefined,
  ) {
    this._magicData = new TextEncoder().encode(magicValue);
    if (this._cert && this._key) {
      this._httpsServer = createServer({
        cert: this._cert,
        key: this._key,
      });
    } else {
      console.warn(
        "No TLS cert/key provided for UDP server, WebSocket connections will be unencrypted",
      );
      this._httpsServer = undefined;
    }
  }

  /**
   * Start the signaling WebSocket and accept incoming client offers (SDP/ICE).
   *
   * @returns void
   */
  public listen() {
    const webSocketServer = this.startWebSocketServer();

    webSocketServer.on("connection", (webSocket, request) => {
      const pendingCandidates: any[] = [];
      const pc = this.setupRtcSendIceCandidates(webSocket);
      this.receiveClientDataChannel(pc, request.socket.remoteAddress);

      webSocket.on("message", async (raw: RawData) => {
        const data = JSON.parse(raw.toString());

        if (data.type === "offer") {
          await this.receiveClientOffer(pc, data.offer, pendingCandidates, webSocket);
        }

        if (data.type === "ice" && data.candidate && data.candidate.candidate) {
          if (pc.remoteDescription) {
            await pc.addIceCandidate(data.candidate);
          } else {
            pendingCandidates.push(data.candidate);
          }
        }
      });

      webSocket.on("close", () => {
        pc.close();
      });
    });
  }

  /**
   * Return a snapshot array of client IDs with active data channels.
   *
   * @returns number[]
   */
  public getConnectedClients(): number[] {
    return [...this._clients.keys()];
  }

  /**
   * Broadcast a packet to all connected clients over the unreliable data channels.
   * The server will frame the provided data with the configured magic terminator.
   *
   * @param data - Raw packet bytes (Uint8Array) to send to every client
   * @returns void
   */
  public sendToEverybody(data: Uint8Array) {
    const magicPacket = buildMagicPacket(data, this._magicData);
    this._clients.forEach((client) => {
      client.channel.send(magicPacket);
    });
  }

  /**
   * Send a packet to a single client via the unreliable data channel.
   * The packet will be framed with the server's configured magic terminator
   * bytes before being sent.
   *
   * @param clientId - Numeric client identifier returned by `listen()` events
   * @param data - Raw packet bytes (Uint8Array) to send
   * @returns void
   */
  public sendToClient(clientId: number, data: Uint8Array) {
    const client = this._clients.get(clientId);
    if (!client) {
      console.error(`Unknown client: ${clientId}`);
      return;
    }
    client.channel.send(buildMagicPacket(data, this._magicData));
  }

  /**
   * Reassemble buffered chunks and return a map of clientId => complete packets.
   * Partial packets are retained internally for the next call so callers may
   * repeatedly poll this method to consume newly arrived data.
   *
   * @returns Map<number, Uint8Array[]>
   */
  public getReceivedPackets(): Map<number, Uint8Array[]> {
    const packets = new Map<number, Uint8Array[]>();

    this._clients.forEach((client, clientId) => {
      const {
        packets: clientPackets,
        data,
        chunkedData,
      } = parsePacketsFromChunks(client.data, client.chunkedData, this._magicData);
      client.data = data;
      client.chunkedData = chunkedData;
      packets.set(clientId, clientPackets);
    });
    return packets;
  }

  private async receiveClientOffer(
    pc: RTCPeerConnection,
    offer: any,
    pendingCandidates: any[],
    webSocket: WebSocket,
  ) {
    await pc.setRemoteDescription(offer);

    for (const cand of pendingCandidates) {
      await pc.addIceCandidate(cand);
    }
    pendingCandidates.length = 0;

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    webSocket.send(JSON.stringify({ type: "answer", answer: pc.localDescription }));
  }

  private setupRtcSendIceCandidates(webSocket: WebSocket) {
    const pc = new RTCPeerConnection();
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") {
        console.error("ICE failed");
        pc.close();
      }
    };

    pc.onicecandidate = (ev: { candidate: any }) => {
      if (ev.candidate) {
        webSocket.send(JSON.stringify({ type: "ice", candidate: ev.candidate }));
      }
    };
    return pc;
  }

  private receiveClientDataChannel(pc: any, clientIp: string | undefined) {
    pc.ondatachannel = (event: { channel: RTCDataChannel }) => {
      const channel = event.channel;
      this._clients.set(this._nextClientId, {
        channel: channel,
        data: new Uint8Array(),
        chunkedData: [],
      });
      const id = this._nextClientId;
      const client = this._clients.get(id);
      this._nextClientId++;

      channel.onopen = () => {
        console.log("UDP openned for user: " + id + ", ip: " + clientIp);
      };

      channel.onmessage = (msg: { data: any }) => {
        const chunk = new Uint8Array(msg.data);
        client?.chunkedData.push(chunk);
      };

      channel.onclose = () => {
        console.log("UDP closed for user: " + id + ", ip: " + clientIp);
        this._clients.delete(id);
      };

      channel.onerror = (ev: RTCErrorEvent): void => {
        console.error('UDP error for user: " + id + ", ip: " + clientIp', { cause: ev });
        this._clients.delete(id);
      };
    };
  }

  private startWebSocketServer(): WebSocketServer {
    if (this._httpsServer) {
      const webSocketServer = new WebSocketServer({
        server: this._httpsServer,
        port: this._port,
        host: this._host,
      });

      console.log(
        "Secure WebSocketServer for UDP listening on wss://" + this._host + ":" + this._port,
      );
      return webSocketServer;
    } else {
      const webSocketServer = new WebSocketServer({
        port: this._port,
        host: this._host,
      });

      console.log("WebSocketServer for UDP listening on ws://" + this._host + ":" + this._port);
      return webSocketServer;
    }
  }
}
