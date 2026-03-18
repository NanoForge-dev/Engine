export enum SaveLibraryTypeEnum {
  COMPONENT_SYSTEM = "component-system",
  GRAPHICS = "graphics",
  ASSET_MANAGER = "asset-manager",
  NETWORK = "network",
  INPUT = "input",
  SOUND = "sound",
}

export interface SaveLibrary {
  id: string;
  type: SaveLibraryTypeEnum | string;
  name: string;
  path: string;
}

export interface SaveComponent {
  name: string;
  path: string;
}

export interface SaveSystem {
  name: string;
  path: string;
}

export interface SaveEntity {
  id: string;
  components: {
    name: string;
    params: string[];
  }[];
}

export interface Save {
  libraries: SaveLibrary[];
  components: SaveComponent[];
  systems: SaveSystem[];
  entities: SaveEntity[];
}
