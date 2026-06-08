import { NfException } from "../abstracts/exception.abstract";

/**
 * Thrown when a requested resource (asset, sound, music track, etc.) cannot
 * be found in the engine's registry.
 *
 * @example
 * ```ts
 * // Thrown automatically by AssetManagerLibrary.getAsset, SoundLibrary.play, etc.
 * try {
 *   const file = assetManager.getAsset("/textures/hero.png");
 * } catch (err) {
 *   if (err instanceof NfNotFound) {
 *     console.error("Missing resource:", err.message);
 *   }
 * }
 * ```
 */
export class NfNotFound extends NfException {
  /** Always `404`. */
  get code(): number {
    return 404;
  }

  /**
   * @param item - Name or path of the missing resource.
   * @param type - Optional category label (e.g. "Asset", "Sound").
   */
  constructor(item: string, type?: string) {
    super(`${type ? `${type} - ` : ""}${item} not found.`);
  }
}
