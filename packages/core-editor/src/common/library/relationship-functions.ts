import { type ILibrary, type LibraryHandle } from "@nanoforge-dev/common";

class RelationshipStatic {
  getLibrariesByDependencies(libraries: LibraryHandle[], reverse: boolean = false) {
    let response: LibraryHandle[] = [];
    for (const library of libraries) {
      if (!library) continue;
      response = this._pushLibraryWithDependencies(library, response, [], libraries);
    }

    if (reverse) return response.reverse();
    return response;
  }

  getLibrariesByRun<T extends ILibrary = ILibrary>(libraries: LibraryHandle<T>[]) {
    let response: LibraryHandle<T>[] = [];
    const dependencies = new Map<symbol, Set<symbol>>(
      libraries.map((library) => [library.symbol, new Set<symbol>()]),
    );

    for (const handle of libraries) {
      const key = handle.symbol;

      for (const before of handle.library.__relationship.runBefore) {
        this._pushToDependencies(key, before, dependencies);
      }
      for (const after of handle.library.__relationship.runAfter) {
        this._pushToDependencies(after, key, dependencies);
      }
    }

    for (const library of libraries) {
      response = this._pushLibraryWithDependenciesRun(
        library,
        dependencies,
        response,
        [],
        libraries,
      );
    }
    return response;
  }

  private _pushToDependencies(
    key: symbol,
    value: symbol,
    dependencies: Map<symbol, Set<symbol>>,
  ): void {
    let curr = dependencies.get(key);
    if (!curr) curr = new Set();
    curr.add(value);
    dependencies.set(key, curr);
  }

  private _pushLibraryWithDependenciesRun<T extends ILibrary = ILibrary>(
    handle: LibraryHandle<T>,
    dependencies: Map<symbol, Set<symbol>>,
    response: LibraryHandle<T>[],
    cache: symbol[],
    libraries: LibraryHandle<T>[],
  ): LibraryHandle<T>[] {
    const key = handle.symbol;
    if (this._symbolIsInList(key, response)) return response;

    if (cache.includes(key)) throw new Error("Circular dependencies !");

    cache.push(key);

    const deps = dependencies.get(key);
    if (!deps) throw new Error("Dependencies not found");

    for (const dep of deps) {
      if (this._symbolIsInList(dep, response)) continue;

      const depHandle = libraries.find((lib) => lib?.symbol === dep) as LibraryHandle<T>;
      if (!depHandle) throw new Error(`Cannot find library ${dep.toString()}`);

      response = this._pushLibraryWithDependenciesRun<T>(
        depHandle,
        dependencies,
        response,
        cache,
        libraries,
      );
    }
    cache.pop();

    response.push(handle);
    return response;
  }

  private _pushLibraryWithDependencies(
    handle: LibraryHandle,
    response: LibraryHandle[],
    cache: symbol[],
    libraries: LibraryHandle[],
  ): LibraryHandle[] {
    if (this._symbolIsInList(handle.symbol, response)) return response;

    if (cache.includes(handle.symbol)) throw new Error("Circular dependencies !");

    cache.push(handle.symbol);
    for (const dep of handle.library.__relationship.dependencies) {
      if (this._symbolIsInList(dep, response)) continue;

      const depHandle = libraries.find((lib) => lib?.symbol === dep) as LibraryHandle;
      if (!depHandle) throw new Error(`Cannot find library ${dep.toString()}`);

      response = this._pushLibraryWithDependencies(depHandle, response, cache, libraries);
    }
    cache.pop();

    response.push(handle);
    return response;
  }

  private _symbolIsInList(sym: symbol, libraries: LibraryHandle[]): boolean {
    return libraries.some((lib) => lib.symbol === sym);
  }
}

export const Relationship = new RelationshipStatic();
