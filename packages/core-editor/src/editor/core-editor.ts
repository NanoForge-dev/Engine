import { NfNotFound } from "@nanoforge-dev/common";
import { type ECSClientLibrary, type Entity } from "@nanoforge-dev/ecs-client";

import type { SaveComponent, SaveEntity } from "../common/context/save.type";

export class CoreEditor {
  private ecsLibrary: ECSClientLibrary;
  constructor(ecsLibrary: ECSClientLibrary) {
    this.ecsLibrary = ecsLibrary;
  }

  public askEntitiesHotReload(saveComponents: SaveComponent[], entityToReload: SaveEntity[]): void {
    const reg = this.ecsLibrary.registry;
    entityToReload.forEach(({ id, components }) => {
      Object.entries(components).forEach(([componentName, params]) => {
        const ogComponent = saveComponents.find(({ name: paramName }) => {
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
        .getComponentsConst({ name: "__RESERVED_ENTITY_ID" })
        .getIndex({ name: "__RESERVED_ENTITY_ID", entityId: entityId }),
    );
  }
}
