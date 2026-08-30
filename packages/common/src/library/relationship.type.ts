/**
 * Ordering relationships between a library and other libraries, referenced
 * by their `key`.
 */
export interface LibraryRelationships {
  /** Keys of libraries that must be initialized before this one. */
  dependencies: string[];
  /** Keys of libraries this one must run before, each tick. */
  runBefore: string[];
  /** Keys of libraries this one must run after, each tick. */
  runAfter: string[];
}

export const DEFAULT_LIBRARY_RELATIONSHIPS: LibraryRelationships = {
  dependencies: [],
  runBefore: [],
  runAfter: [],
};
