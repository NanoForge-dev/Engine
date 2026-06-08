/**
 * Identifies the role a library plays in a saved scene.
 */
export enum SaveLibraryTypeEnum {
  COMPONENT_SYSTEM = "component-system",
  GRAPHICS = "graphics",
  ASSET_MANAGER = "asset-manager",
  NETWORK = "network",
  INPUT = "input",
  SOUND = "sound",
}

/**
 * Serialised representation of a registered library in a saved scene.
 */
export interface SaveLibrary {
  /** Unique identifier for this library instance in the scene. */
  id: string;
  /** Library role (one of `SaveLibraryTypeEnum` or a custom string). */
  type: SaveLibraryTypeEnum | string;
  /** Human-readable name of the library. */
  name: string;
  /** Module path used to import the library at runtime. */
  path: string;
}

/**
 * Serialised representation of an ECS component type in a saved scene.
 */
export interface SaveComponent {
  /** Component class name. */
  name: string;
  /** Module path used to import the component at runtime. */
  path: string;
  /** Names of the constructor parameters exposed in the editor. */
  paramsNames: string[];
}

/**
 * Serialised representation of an ECS system in a saved scene.
 */
export interface SaveSystem {
  /** System class name. */
  name: string;
  /** Module path used to import the system at runtime. */
  path: string;
}

/**
 * Serialised representation of an entity and its component data.
 */
export interface SaveEntity {
  /** Unique identifier for this entity instance. */
  id: string;
  /** Map of component name to its property values. */
  components: Record<string, Record<string, any>>;
}

/**
 * Root serialised scene state exchanged between the editor and the engine.
 */
export interface Save {
  /** All libraries registered in the scene. */
  libraries: SaveLibrary[];
  /** All component types available in the scene. */
  components: SaveComponent[];
  /** All systems active in the scene. */
  systems: SaveSystem[];
  /** All spawned entities and their component data. */
  entities: SaveEntity[];
}
