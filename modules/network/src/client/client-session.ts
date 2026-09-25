import { SESSION_TOKEN_PARAM, type WelcomeMessage, isWelcomeMessage } from "../shared/session";

/** How long `connect` waits for the server's welcome message. */
export const WELCOME_TIMEOUT_MS = 5000;

/**
 * Session state shared by the TCP and UDP clients of one application.
 *
 * @remarks
 * Filled by the first welcome message received. Only kept in memory, so a page
 * reload starts a new session.
 */
export type ClientSession = {
  /** Client identifier assigned by the server. */
  id?: string;
  /** Secret presented by the next transport to join the same session. */
  token?: string;
};

/** Pending wait for the server's welcome message. */
export type WelcomeWait = {
  promise: Promise<void>;
  /** Resolve the wait, or reject it with `error`. Later calls are ignored. */
  settle: (error?: Error) => void;
};

/**
 * Build the WebSocket URL of a server endpoint, joining the current session
 * when it already has a token.
 *
 * @param wss - Use `wss://` instead of `ws://`.
 * @param ip - Server hostname or IP.
 * @param port - Server port.
 * @param session - Current client session.
 * @returns The URL to connect to.
 */
export const buildServerUrl = (
  wss: boolean,
  ip: string,
  port: number,
  session: ClientSession,
): string => {
  const url = `ws${wss ? "s" : ""}://${ip}:${port}`;
  if (session.token === undefined) return url;
  return `${url}/?${SESSION_TOKEN_PARAM}=${encodeURIComponent(session.token)}`;
};

/**
 * Start waiting for the server's welcome message.
 *
 * @param label - Transport name used in error messages.
 * @param timeoutMs - Delay after which the wait is rejected.
 * @returns The pending wait.
 */
export const waitForWelcome = (label: string, timeoutMs = WELCOME_TIMEOUT_MS): WelcomeWait => {
  let settle!: (error?: Error) => void;
  const promise = new Promise<void>((resolve, reject) => {
    let done = false;
    const timeout = setTimeout(
      () => settle(new Error(`${label} welcome timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );
    settle = (error) => {
      if (done) return;
      done = true;
      clearTimeout(timeout);
      if (error) reject(error);
      else resolve();
    };
  });
  // Mark as handled: a rejection nobody awaits yet must not be reported as unhandled.
  promise.catch(() => {});
  return { promise, settle };
};

/**
 * Normalize a thrown value to an `Error`.
 *
 * @param error - Thrown value.
 * @returns The error itself, or an `Error` wrapping it.
 */
export const toError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error));

/**
 * Apply a control message to the session if it is a welcome.
 *
 * @param session - Session to update.
 * @param message - Parsed control message.
 * @returns The welcome, or `null` when `message` is something else.
 */
export const applyWelcome = (session: ClientSession, message: unknown): WelcomeMessage | null => {
  if (!isWelcomeMessage(message)) return null;
  session.id = message.id;
  session.token = message.token;
  return message;
};
