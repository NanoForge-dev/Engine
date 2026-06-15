import {
  COMPONENT_SYSTEM_LIBRARY,
  type Context,
  GRAPHICS_LIBRARY,
  type InitContext,
  Library,
} from "@nanoforge-dev/common";
import { EditorEvents, type EventEmitter } from "@nanoforge-dev/core-editor";
import type { AbstractECSLibrary, Registry } from "@nanoforge-dev/ecs-lib";

export class Graphics2DEditorLibrary extends Library {
  private _eventEmitter?: EventEmitter;
  private _initComponents: Map<string, Set<string>> = new Map();

  constructor() {
    super({
      dependencies: [COMPONENT_SYSTEM_LIBRARY, GRAPHICS_LIBRARY],
    });
  }

  /** @internal */
  get __name(): string {
    return "Graphics2DEditorLibrary";
  }

  /** @internal */
  public override async __init(context: InitContext): Promise<void> {
    this._eventEmitter = context.editor.eventEmitter;
    const reg = context.libraries.getComponentSystem<AbstractECSLibrary>().library.registry;
    reg.addSystem(this._dragSystem.bind(this));
    void context;
  }

  private _dragSystem(registry: Registry, ctx: Context) {
    void registry;
    void ctx;
    if (!this._eventEmitter) return;
    registry
      .getZipper([
        { name: "__RESERVED_ENTITY_ID" },
        { name: "DrawableCircle2D" },
        { name: "DrawableRect2D" },
        { name: "DrawableText2D" },
      ])
      .forEach(({ __RESERVED_ENTITY_ID, DrawableCircle2D, DrawableRect2D, DrawableText2D }) => {
        if (!this._initComponents.has(__RESERVED_ENTITY_ID))
          this._initComponents.set(__RESERVED_ENTITY_ID, new Set());
        const m = this._initComponents.get(__RESERVED_ENTITY_ID) as Set<string>;
        [DrawableCircle2D, DrawableRect2D, DrawableText2D].forEach((comp) => {
          if (!m.has(comp.name)) {
            comp.shape.draggable(true);
            comp.shape.on("dragend", () => {
              this._eventEmitter?.emit(
                EditorEvents.MOVE_COMPONENT,
                __RESERVED_ENTITY_ID,
                comp.name,
                comp.shape.getPosition(),
              );
            });
            m.add(comp);
          }
        });
      });
  }
}
