export class NfFile {
  private readonly _path: string;

  constructor(path: string) {
    this._path = path;
  }

  get path(): string {
    return this._path;
  }

  public async getText(): Promise<string> {
    const res = await fetch(this._path);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.text();
  }
}
