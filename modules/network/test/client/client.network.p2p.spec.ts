import type { InitContext } from "@nanoforge-dev/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NetworkClientLibrary, definePacket } from "../../src/client";
import { PEER_HOST_KEY } from "../../src/shared/signaling";

const env = {
  NETWORK_MODE: "p2p",
  SERVER_ADDRESS: "127.0.0.1",
  SERVER_TCP_PORT: "4445",
};

const makeInitContext = (files: [string, string][] = []): InitContext => ({
  vars: { get: () => undefined, set: () => {} },
  env,
  files: new Map(files),
});

const moduleUrl = (code: string) => `data:text/javascript,${encodeURIComponent(code)}`;

const Play = definePacket("play");

describe("NetworkClientLibrary in p2p mode", () => {
  let sockets: any[];
  let dataChannels: any[];

  beforeEach(() => {
    sockets = [];
    dataChannels = [];
    vi.stubGlobal("location", { search: "", origin: "https://game.test", pathname: "/play" });
    vi.stubGlobal(
      "WebSocket",
      Object.assign(
        vi.fn(function (this: any, url: string) {
          Object.assign(this, { url, readyState: 1, send: vi.fn(), close: vi.fn() });
          sockets.push(this);
        }),
        { OPEN: 1 },
      ),
    );
    vi.stubGlobal(
      "RTCPeerConnection",
      vi.fn(function (this: any) {
        Object.assign(this, {
          close: vi.fn(),
          createDataChannel: vi.fn((label: string) => {
            const channel = { label, readyState: "open", send: vi.fn() };
            dataChannels.push(channel);
            return channel;
          }),
          createOffer: vi.fn().mockResolvedValue({ type: "offer", sdp: "v=0" }),
          setLocalDescription: vi.fn().mockResolvedValue(undefined),
        });
      }),
    );
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, PEER_HOST_KEY);
    Reflect.deleteProperty(globalThis, "__serverArgs");
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should join the room named in the page URL over WebRTC", async () => {
    vi.stubGlobal("location", {
      search: "?room=ABC234",
      origin: "https://game.test",
      pathname: "/play",
    });
    const lib = new NetworkClientLibrary();
    const init = lib.__init(makeInitContext());
    await new Promise((resolve) => setTimeout(resolve));
    await sockets[0].onmessage({
      data: JSON.stringify({ type: "welcome", id: "client-7", token: "t0k3n" }),
    });
    await init;

    expect(sockets[0].url).toBe("ws://127.0.0.1:4445/?room=ABC234");
    expect(dataChannels.map((channel) => channel.label)).toStrictEqual([
      "reliable-ordered",
      "reliable-unordered",
      "unreliable-ordered",
      "unreliable-unordered",
    ]);
    expect(lib.clientId).toBe("client-7");
    expect(lib.isConnected()).toBe(true);
    expect(lib.roomCode).toBe("ABC234");
    expect(lib.inviteLink).toBe("https://game.test/play?room=ABC234");
  });

  it("should host: run the server app in this page and join it through the loopback", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const sendData = vi.fn();
    const main = moduleUrl(`export const main = async (args) => {
      globalThis.__serverArgs = args;
      globalThis[Symbol.for("nanoforge.network.host")] = {
        room: "XYZ789",
        attachLocal: () => ({
          id: "local-0",
          transport: globalThis.__localTransport,
        }),
      };
      await new Promise(() => {});
    };`);
    Reflect.set(globalThis, "__localTransport", {
      sendData,
      getReceivedPackets: () => [],
      isConnected: () => true,
    });
    const lib = new NetworkClientLibrary();
    await lib.__init(
      makeInitContext([
        ["/server/main.js", main],
        ["/server/libecs.wasm", "blob:wasm"],
        ["/libecs.wasm", "blob:client-wasm"],
      ]),
    );

    const args = Reflect.get(globalThis, "__serverArgs");
    expect(args.files).toStrictEqual(
      new Map([
        ["/main.js", main],
        ["/libecs.wasm", "blob:wasm"],
      ]),
    );
    expect(args.env).toBe(env);
    expect(lib.clientId).toBe("local-0");
    expect(lib.isConnected()).toBe(true);
    expect(lib.roomCode).toBe("XYZ789");
    expect(lib.inviteLink).toBe("https://game.test/play?room=XYZ789");
    expect(info).toHaveBeenCalledWith("Invite: https://game.test/play?room=XYZ789");

    lib.packets.send(Play);
    expect(sendData).toHaveBeenCalledWith("reliable-ordered", expect.any(Uint8Array));
    Reflect.deleteProperty(globalThis, "__localTransport");
  });

  it("should fail to host without the server app built for the browser", async () => {
    await expect(new NetworkClientLibrary().__init(makeInitContext())).rejects.toThrow(
      "p2p needs the server app built for the browser",
    );
  });

  it("should fail to host when the server app fails to start", async () => {
    const main = moduleUrl(`export const main = async () => { throw new Error("no wasm"); };`);
    await expect(
      new NetworkClientLibrary().__init(makeInitContext([["/server/main.js", main]])),
    ).rejects.toThrow("the server app failed to start");
  });

  it("should need SERVER_TCP_PORT to reach the signaling server", async () => {
    const ctx = {
      ...makeInitContext(),
      env: { ...env, SERVER_TCP_PORT: undefined, SERVER_UDP_PORT: "4444" },
    };
    await expect(new NetworkClientLibrary().__init(ctx)).rejects.toThrow(
      "p2p needs SERVER_TCP_PORT",
    );
  });
});
