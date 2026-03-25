import { NfNotFound } from "@nanoforge-dev/common";
import { type ECSClientLibrary } from "@nanoforge-dev/ecs-client";
import { type ECSServerLibrary } from "@nanoforge-dev/ecs-server";

import type { SaveComponent, SaveEntity } from "../common/context/save.type";

export class CoreEditor {
  private ecsLibrary: ECSClientLibrary | ECSServerLibrary;
  constructor(ecsLibrary: ECSClientLibrary | ECSServerLibrary) {
    this.ecsLibrary = ecsLibrary;
  }

  public askEntityHotReload(saveComponents: SaveComponent[], entityToReload: SaveEntity[]): void {
    const reg = this.ecsLibrary.registry;
    entityToReload.forEach(({ id, components }) => {
      Object.entries(components).forEach(([componentName, params]) => {
        const ogComponent = saveComponents.find(({ name: paramName }) => {
          return paramName == componentName;
        });
        if (!ogComponent) {
          throw new NfNotFound("Component: " + componentName + " not found in saved components");
        }
        const ecsComponent = reg.getComponents({ name: componentName }).get(Number(id));
        Object.entries(params).forEach(([paramName, paramValue]) => {
          ecsComponent[paramName] = paramValue;
        });
        reg.getComponents({ name: componentName }).set(Number(id), ecsComponent);
      });
    });
  }
}
