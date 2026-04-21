import { NfNotFound } from "@nanoforge-dev/common";
import { type ECSClientLibrary, type Entity } from "@nanoforge-dev/ecs-client";

import { EventTypeEnum } from "../common/context/event-emitter.type";
import { type IEditorRunOptions } from "../common/context/options.type";

export class CoreEditor {
  private editor: IEditorRunOptions["editor"];
  private ecsLibrary: ECSClientLibrary;
  constructor(editor: IEditorRunOptions["editor"], ecsLibrary: ECSClientLibrary) {
    this.editor = editor;
    this.ecsLibrary = ecsLibrary;
    this.editor.coreEvents?.addListener(
      EventTypeEnum.HOT_RELOAD,
      this.askEntitiesHotReload.bind(this),
    );
  }

  public runEvents() {
    this.editor.coreEvents?.runEvents();
  }

  public askEntitiesHotReload(): void {
    const reg = this.ecsLibrary.registry;
    const save = this.editor.save;
    save.entities.forEach(({ id, components }) => {
      Object.entries(components).forEach(([componentName, params]) => {
        const ogComponent = save.components.find(({ name: paramName }) => {
          return paramName == componentName;
        });
        if (!ogComponent) {
          throw new NfNotFound("Component: " + componentName + " not found in saved components");
        }
        const ecsEntity: Entity = this.getEntityFromEntityId(id);
        const ecsComponent = reg.getEntityComponent(ecsEntity, {
          name: componentName,
        });
        Object.entries(params).forEach(([paramName, paramValue]) => {
          ecsComponent[paramName] = paramValue;
        });
        reg.addComponent(ecsEntity, ecsComponent);
      });
    });
  }

  private getEntityFromEntityId(entityId: string): Entity {
    const reg = this.ecsLibrary.registry;
    return reg.entityFromIndex(
      reg
        .getComponents({ name: "__RESERVED_ENTITY_ID" })
        .getIndex({ name: "__RESERVED_ENTITY_ID", entityId: entityId }),
    );
  }
}
