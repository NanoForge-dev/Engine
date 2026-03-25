import { NfNotFound } from "@nanoforge-dev/common";
import { type ECSClientLibrary } from "@nanoforge-dev/ecs-client";
import { type ECSServerLibrary } from "@nanoforge-dev/ecs-server";

import type { IEditorRunOptions } from "../common/context/options.type";
import type { SaveComponent, SaveEntity } from "../common/context/save.type";

export class CoreEditor {
  private editor: IEditorRunOptions["editor"];
  private ecsLibrary: ECSClientLibrary | ECSServerLibrary;
  constructor(
    editor: IEditorRunOptions["editor"],
    ecsLibrary: ECSClientLibrary | ECSServerLibrary,
  ) {
    this.editor = editor;
    this.ecsLibrary = ecsLibrary;
  }

  public askEntityHotReload(saveComponents: SaveComponent[], entityToReload: SaveEntity[]): void {
    const reg = this.ecsLibrary.registry;
    entityToReload.forEach(({ id, components }) => {
      Object.entries(components).forEach(([componentName, params]) => {
        const ogComponent = saveComponents.find(({ name: paramName }) => {
          if (!ogComponent) {
            throw new NfNotFound("Component: " + componentName + " not found in saved components");
          }
          return paramName == componentName;
        });
        const ecsComponent = reg.getComponents({ name: componentName }).get(Number(id));
        Object.entries(params).forEach(([paramName, paramValue]) => {
          ecsComponent[paramName] = paramValue;
        });
        reg.getComponents({ name: componentName }).set(Number(id), ecsComponent);
      });
    });
  }
}
