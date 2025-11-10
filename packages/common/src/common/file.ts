import { NfFetchException } from "../exception";

export class NfFile {
  private readonly _path: string;

  constructor(path: string) {
    this._path = path;
  }

  get path(): string {
    return this._path;
  }

  public async arrayBuffer(): Promise<ArrayBuffer> {
    const res = await this._fetch();
    return await res.arrayBuffer();
  }

  public async blob(): Promise<Blob> {
    const res = await this._fetch();
    return await res.blob();
  }

  public async bytes(): Promise<Uint8Array<ArrayBuffer>> {
    const res = await this._fetch();
    return await res.bytes();
  }

  public async formData(): Promise<FormData> {
    const res = await this._fetch();
    return await res.formData();
  }

  public async json(): Promise<any> {
    const res = await this._fetch();
    return await res.json();
  }

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
