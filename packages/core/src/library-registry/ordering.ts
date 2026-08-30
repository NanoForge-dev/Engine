import type { Library } from "@nanoforge-dev/common";

const topologicalOrder = (
  libraries: Library[],
  getDependencyKeys: (lib: Library) => string[],
): Library[] => {
  const byKey = new Map(libraries.map((lib) => [lib.key, lib]));
  const ordered: Library[] = [];
  const visited = new Set<string>();
  const visiting: string[] = [];

  const visit = (lib: Library): void => {
    if (visited.has(lib.key)) return;
    if (visiting.includes(lib.key)) throw new Error("Circular dependencies!");

    visiting.push(lib.key);
    for (const depKey of getDependencyKeys(lib)) {
      const dep = byKey.get(depKey);
      if (!dep) throw new Error(`Cannot find library "${depKey}"`);
      visit(dep);
    }
    visiting.pop();

    visited.add(lib.key);
    ordered.push(lib);
  };

  for (const lib of libraries) visit(lib);
  return ordered;
};

/** Orders libraries so each one's `dependencies` come before it. */
export const orderByDependencies = (libraries: Library[]): Library[] =>
  topologicalOrder(libraries, (lib) => lib.relationships.dependencies);

/**
 * Orders libraries for the tick loop: each library's `runBefore` entries
 * come before it, and its `runAfter` entries come after it.
 */
export const orderByRunSequence = (libraries: Library[]): Library[] => {
  const runDependencies = new Map<string, Set<string>>(
    libraries.map((lib) => [lib.key, new Set<string>()]),
  );

  for (const library of libraries) {
    for (const before of library.relationships.runBefore) {
      runDependencies.get(library.key)?.add(before);
    }
    for (const after of library.relationships.runAfter) {
      runDependencies.get(after)?.add(library.key);
    }
  }

  return topologicalOrder(libraries, (lib) => [...(runDependencies.get(lib.key) ?? [])]);
};
