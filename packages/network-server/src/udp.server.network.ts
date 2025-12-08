import { RTCPeerConnection } from "wrtc";
import { type RawData, type WebSocket, WebSocketServer } from "ws";

import { buildMagicPacket, parsePacketsFromChunks } from "./utils";

export class UDPServer {
  private _clients = new Map<
    number,
    { channel: RTCDataChannel; data: Uint8Array; chunkedData: Uint8Array[] }
  >();
  private _nextClientId: number = 0;
  private readonly _magicData = new Uint8Array();

  constructor(
    private _port: number,
    private _host: string,
    magicValue: string,
  ) {
    this._magicData = new TextEncoder().encode(magicValue);
  }

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

  public getConnectedClients(): number[] {
    return [...this._clients.keys()];
  }

  public sendToEverybody(data: Uint8Array) {
    const magicPacket = buildMagicPacket(data, this._magicData);
    this._clients.forEach((client) => {
      client.channel.send(magicPacket);
    });
  }

  public sendToClient(clientId: number, data: Uint8Array) {
    const client = this._clients.get(clientId);
    if (!client) {
      console.error(`Unkown client: ${clientId}`);
      return;
    }
    client.channel.send(buildMagicPacket(data, this._magicData));
  }

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
    const webSocketServer = new WebSocketServer({
      port: this._port,
      host: this._host,
    });

    console.log("WebSocketServer for UDP listening on ws://" + this._host + ":" + this._port);
    return webSocketServer;
  }
}
