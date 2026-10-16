import type { RunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { NetworkServerLibrary } from "@nanoforge-dev/network/server";

/**
 * Pairs the players for their WebRTC handshake (`LISTENING_SIGNALING_PORT`):
 * the game itself runs in the host's browser.
 */
export const main = async (options: RunOptions): Promise<void> => {
  const app = NanoforgeFactory.createServer({ tickRate: 1 });
  app.use(new NetworkServerLibrary());

  await app.init(options);
  await app.run();
};
