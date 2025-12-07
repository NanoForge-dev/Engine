/**
 * * Editor Component Element Defaults
 * Basic fields for Editor Component Element
 * @param Type - Type of the element
 * @param Default - Type of the element's default value
 */
type ECSElementDefaults<Type, Default> = {
  /**
   * Type of the element
   */
  type: Type;

  /**
   * Name of the element
   */
  name: string;

  /**
   * Description of the element
   */
  description?: string;

  /**
   * Example of the element
   */
  example?: Default;

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
type ECSStringElement = {
  /**
   * Values allowed for the element
   */
  enum?: string[];
} & ECSElementDefaults<"string", string>;

/**
 * * Editor Component Number Element
 * Type for number element
 */
type ECSNumberElement = ECSElementDefaults<"number", number>;

/**
 * * Editor Component Boolean Element
 * Type for boolean element
 */
type ECSBooleanElement = ECSElementDefaults<"boolean", boolean>;

/**
 * * Editor Component Array Element
 * Type for array element
 */
type ECSArrayElement = {
  /**
   * Items of the array
   */
  items: ECSElement;
} & ECSElementDefaults<"array", any[]>;

/**
 * * Editor Component Object Element
 * Type for object element
 */
type ECSObjectElement = {
  /**
   * Properties of the object
   */
  properties: Record<string, ECSElement>;
} & ECSElementDefaults<"object", object>;

/**
 * * Editor Component Element
 * Type for component element
 */
type ECSElement =
  | ECSStringElement
  | ECSNumberElement
  | ECSBooleanElement
  | ECSArrayElement
  | ECSObjectElement;

/**
 * Manifest for a component to be used in the NanoForge Editor
 */
export type EditorComponentManifest = {
  /**
   * Displayed name of the component
   */
  name: string;

  /**
   * Description of the component
   */
  description?: string;

  /**
   * Parameters of the component
   */
  params: Record<string, ECSElement>;
};

/**
 * Manifest for a system to be used in the NanoForge Editor
 */
export type EditorSystemManifest = {
  /**
   * Displayed name of the system
   */
  name: string;

  /**
   * Description of the system
   */
  description?: string;

  /**
   * Component names needed by the system
   */
  dependencies: string[];
};
