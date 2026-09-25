/** Query parameter a client uses to join an existing session. */
export const SESSION_TOKEN_PARAM = "token";

/**
 * Control message sent by the server when a transport joins a session.
 *
 * @remarks
 * TCP delivers it as a WebSocket text frame (game data is always binary),
 * UDP delivers it on the JSON signaling socket.
 */
export type WelcomeMessage = {
  type: "welcome";
  /** Session-wide client identifier, shared by every transport. */
  id: string;
  /** Secret the client presents to link another transport to this session. */
  token: string;
};

/**
 * Narrow an already parsed control message to a {@link WelcomeMessage}.
 *
 * @param message - Parsed JSON value.
 * @returns `true` when `message` is a well-formed welcome.
 */
export const isWelcomeMessage = (message: unknown): message is WelcomeMessage => {
  if (typeof message !== "object" || message === null) return false;
  const { type, id, token } = message as Record<string, unknown>;
  return type === "welcome" && typeof id === "string" && typeof token === "string";
};
