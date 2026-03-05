import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = resolve(__dirname, "./game");

const wasmPath = resolve(PROJECT_DIR, "../../packages/ecs-server/dist/assets/libecs.wasm");

const timeout = setTimeout(() => {
  console.error("[E2E] Server timed out after 10s — aborting");
  process.exit(1);
}, 10_000);

try {
  const { main } = await import("./game/.nanoforge/server/main.js");

  const files = new Map([["/libecs.wasm", wasmPath]]);
  console.log(`[E2E] Starting server (WASM: ${wasmPath})`);

  await main({ files });

  clearTimeout(timeout);
  console.log("[E2E] Server completed successfully");
  process.exit(0);
} catch (err) {
  clearTimeout(timeout);
  console.error("[E2E] Server failed:", err);
  process.exit(1);
}
