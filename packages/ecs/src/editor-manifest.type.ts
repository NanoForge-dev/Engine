/**
 * * Editor Component Element Defaults
 * Basic fields for Editor Component Element
 * @param Type - Type of the element
 * @param Default - Type of the element's default value
 */
type ECElementDefaults<Type, Default> = {
  /**
   * Type of the element
   */
  type: Type;

  /**
   * Is the element optional
   * @default false
   */
  optional?: boolean;

  /**
   * Default value of the element
   * Force optional to true if set
   */
  default?: Default;
};

/**
 * * Editor Component String Element
 * Type for string element
 */
type ECStringElement = {
  /**
   * Values allowed for the element
   */
  enum?: string[];
} & ECElementDefaults<"string", string>;

/**
 * * Editor Component Number Element
 * Type for number element
 */
type ECNumberElement = ECElementDefaults<"number", number>;

/**
 * * Editor Component Boolean Element
 * Type for boolean element
 */
type ECBooleanElement = ECElementDefaults<"boolean", boolean>;

/**
 * * Editor Component Array Element
 * Type for array element
 */
type ECArrayElement = {
  /**
   * Items of the array
   */
  items: ECElement;
} & ECElementDefaults<"array", any[]>;

/**
 * * Editor Component Object Element
 * Type for object element
 */
type ECObjectElement = {
  /**
   * Properties of the object
   */
  properties: Record<string, ECElement>;
} & ECElementDefaults<"object", object>;

/**
 * * Editor Component Element
 * Type for component element
 */
type ECElement =
  | ECStringElement
  | ECNumberElement
  | ECBooleanElement
  | ECArrayElement
  | ECObjectElement;

/**
 * Manifest for a component to be used in the NanoForge Editor
 */
export type EditorComponentManifest = {
  /**
   * Parameters of the component
   */
  params: ECElement[];
};

/**
 * Manifest for a system to be used in the NanoForge Editor
 */
export type EditorSystemManifest = {
  /**
   * Component names needed by the system
   */
  dependencies: string[];
};
