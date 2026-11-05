import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SignalingServer } from "../../src/server/signaling.server.network";

const serve = vi.fn();
const file = vi.fn((path: string) => ({ path }));

beforeEach(() => {
  let nextId = 0;
  vi.spyOn(crypto, "randomUUID").mockImplementation(
    () => `joiner-${nextId++}` as ReturnType<typeof crypto.randomUUID>,
  );
  serve.mockImplementation(() => ({ stop: vi.fn() }));
  vi.stubGlobal("Bun", { serve, file });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

const listen = () => {
  const server = new SignalingServer(9000, "0.0.0.0");
  server.listen();
  return { server, options: serve.mock.calls[0]?.[0] };
};

/** Upgrade and open a socket the way Bun does; `response` is set when the upgrade is refused. */
const connect = (options: any, url = "http://localhost:9000/") => {
  let data: any;
  const response = options.fetch(new Request(url), {
    upgrade: (_request: unknown, opts: { data: unknown }) => {
      data = opts.data;
      return true;
    },
  });
  const webSocket = { data, send: vi.fn(), close: vi.fn() };
  if (data) options.websocket.open(webSocket);
  return { webSocket, response };
};

const sent = (webSocket: { send: ReturnType<typeof vi.fn> }) =>
  webSocket.send.mock.calls.map(([frame]) => JSON.parse(frame));

/** A host with its room code, and a joiner of that room. */
const pair = () => {
  const { options } = listen();
  const host = connect(options).webSocket;
  const [{ room }] = sent(host);
  host.send.mockClear();
  const joiner = connect(options, `http://localhost:9000/?room=${room}`).webSocket;
  return { options, host, joiner, room };
};

describe("SignalingServer", () => {
  it("should give a host a 6-character room code", () => {
    const { options } = listen();
    const { webSocket } = connect(options);

    expect(sent(webSocket)).toStrictEqual([{ type: "room", room: expect.any(String) }]);
    expect(sent(webSocket)[0].room).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  });

  it("should cap signaling frames", () => {
    const { options } = listen();
    expect(options.websocket.maxPayloadLength).toBe(64 * 1024);
  });

  it("should refuse a joiner of an unknown room", async () => {
    const { options } = listen();
    const { response } = connect(options, "http://localhost:9000/?room=NOPE42");

    expect(response.status).toBe(404);
  });

  it("should forward a joiner's frames to its host, with the joiner's id", () => {
    const { options, host, joiner } = pair();

    options.websocket.message(joiner, JSON.stringify({ type: "offer", offer: { sdp: "v=0" } }));
    expect(sent(host)).toStrictEqual([
      { type: "signal", from: "joiner-0", data: { type: "offer", offer: { sdp: "v=0" } } },
    ]);
  });

  it("should forward the host's frames to the joiner they are addressed to", () => {
    const { options, host, joiner } = pair();
    const welcome = { type: "welcome", id: "p1", token: "t" };

    options.websocket.message(
      host,
      JSON.stringify({ type: "signal", to: "joiner-0", data: welcome }),
    );
    expect(sent(joiner)).toStrictEqual([welcome]);
  });

  it("should not let a host reach a joiner of another room", () => {
    const { options, joiner } = pair();
    const otherHost = connect(options).webSocket;

    options.websocket.message(
      otherHost,
      JSON.stringify({ type: "signal", to: "joiner-0", data: { type: "answer" } }),
    );
    expect(joiner.send).not.toHaveBeenCalled();
  });

  it("should drop frames that are not JSON objects", () => {
    const { options, host, joiner } = pair();

    options.websocket.message(joiner, "{not json");
    options.websocket.message(joiner, "42");
    options.websocket.message(host, "{not json");
    options.websocket.message(host, JSON.stringify({ type: "signal", to: "joiner-0" }));
    expect(host.send).not.toHaveBeenCalled();
    expect(joiner.send).not.toHaveBeenCalled();
  });

  it("should tell the host when a joiner leaves", () => {
    const { options, host, joiner } = pair();

    options.websocket.close(joiner);
    expect(sent(host)).toStrictEqual([{ type: "leave", from: "joiner-0" }]);
  });

  it("should close the room and its joiners when the host leaves", () => {
    const { options, host, joiner, room } = pair();

    options.websocket.close(host);
    expect(joiner.close).toHaveBeenCalledWith(4001, "Host left");
    expect(connect(options, `http://localhost:9000/?room=${room}`).response.status).toBe(404);
  });

  it("should stop Bun's server", () => {
    const { server } = listen();
    server.stop();
    expect(serve.mock.results[0]?.value.stop).toHaveBeenCalledWith(true);
  });
});
