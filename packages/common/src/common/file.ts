import { NfFetchException } from "../exception";

/**
 * Represents a file asset that has been registered with the engine.
 *
 * @remarks
 * Instances are returned by `AssetManagerLibrary.getAsset`.  Each method
 * lazily fetches the file from the engine's virtual file system and returns the
 * content in the requested format.
 *
 * All read methods throw `NfFetchException` when the underlying `fetch`
 * returns a non-OK response.
 *
 * @example
 * ```ts
 * const file = assetManager.getAsset("/textures/hero.png");
 * const buffer = await file.arrayBuffer();
 * ```
 */
export class NfFile {
  private readonly _path: string;

  /**
   * @param path - Internal URL path used to fetch the file.
   */
  constructor(path: string) {
    this._path = path;
  }

  /**
   * Internal URL path used to fetch the file.
   */
  get path(): string {
    return this._path;
  }

  /**
   * Fetch the file and return its content as an `ArrayBuffer`.
   *
   * @throws `NfFetchException` When the HTTP response is not OK.
   */
  public async arrayBuffer(): Promise<ArrayBuffer> {
    const res = await this._fetch();
    return await res.arrayBuffer();
  }

  /**
   * Fetch the file and return its content as a `Blob`.
   *
   * @throws `NfFetchException` When the HTTP response is not OK.
   */
  public async blob(): Promise<Blob> {
    const res = await this._fetch();
    return await res.blob();
  }

  /**
   * Fetch the file and return its content as a `Uint8Array`.
   *
   * @throws `NfFetchException` When the HTTP response is not OK.
   */
  public async bytes(): Promise<Uint8Array<ArrayBuffer>> {
    const res = await this._fetch();
    return await res.arrayBuffer().then((buf) => new Uint8Array(buf));
  }

  /**
   * Fetch the file and return its content as `FormData`.
   *
   * @throws `NfFetchException` When the HTTP response is not OK.
   */
  public async formData(): Promise<FormData> {
    const res = await this._fetch();
    return await res.formData();
  }

  /**
   * Fetch the file, parse it as JSON, and return the result.
   *
   * @throws `NfFetchException` When the HTTP response is not OK.
   */
  public async json(): Promise<any> {
    const res = await this._fetch();
    return await res.json();
  }

  /**
   * Fetch the file and return its content as a UTF-8 string.
   *
   * @throws `NfFetchException` When the HTTP response is not OK.
   */
  public async text(): Promise<string> {
    const res = await this._fetch();
    return await res.text();
  }

  private async _fetch(): Promise<Response> {
    const res = await fetch(this._path);
    if (!res.ok) throw new NfFetchException(res.status, res.statusText);
    return res;
  }
}
