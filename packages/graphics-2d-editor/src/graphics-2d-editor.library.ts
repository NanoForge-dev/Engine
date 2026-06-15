import {
  COMPONENT_SYSTEM_LIBRARY,
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
    this._eventEmitter = context.eventEmitter;
    const reg = context.libraries.getComponentSystem<AbstractECSLibrary>().library.registry;
    reg.addSystem(this._dragSystem.bind(this));
  }

  private _dragSystem(registry: Registry) {
    if (!this._eventEmitter) return;

    const entities = [
      ...registry.getZipper([{ name: "__RESERVED_entityId" }, { name: "DrawableCircle2D" }]),
      ...registry.getZipper([{ name: "__RESERVED_entityId" }, { name: "DrawableRect2D" }]),
      ...registry.getZipper([{ name: "__RESERVED_entityId" }, { name: "DrawableText2D" }]),
    ];
    entities.forEach(
      ({ __RESERVED_entityId, DrawableCircle2D, DrawableRect2D, DrawableText2D }: any) => {
        const entityId = __RESERVED_entityId.entityId;
        if (!this._initComponents.has(entityId)) this._initComponents.set(entityId, new Set());
        const s = this._initComponents.get(entityId) as Set<string>;
        [DrawableCircle2D, DrawableRect2D, DrawableText2D].forEach((comp) => {
          if (!comp) return;
          if (!s.has(comp.name)) {
            comp.shape.draggable(true);
            comp.shape.on("dragend", ({ target }: any) => {
              this._eventEmitter?.emit(
                EditorEvents.MOVE_COMPONENT,
                entityId,
                comp.name,
                target._lastPos,
              );
            });
            s.add(comp.name);
          }
        });
      },
    );
  }
}
