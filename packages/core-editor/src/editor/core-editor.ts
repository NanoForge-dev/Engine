import { NfNotFound } from "@nanoforge-dev/common";
import { type ECSClientLibrary, type Entity } from "@nanoforge-dev/ecs-client";

import { CoreEvents } from "../common/context/events/core-events";
import { type IEditorRunOptions } from "../common/context/options.type";
import { type Save } from "../common/context/save.type";
import { type Core } from "../core/core";

export class CoreEditor {
  private editor: IEditorRunOptions["editor"];
  private ecsLibrary: ECSClientLibrary;
  private lastLoadedSave: Save;
  private core: Core;
  private _isPaused: boolean = false;

  constructor(core: Core, editor: IEditorRunOptions["editor"], ecsLibrary: ECSClientLibrary) {
    this.editor = editor;
    this.lastLoadedSave = JSON.parse(JSON.stringify(this.editor.save));
    this.ecsLibrary = ecsLibrary;
    this.editor.coreEvents?.addListener(CoreEvents.HOT_RELOAD, this.hotReloadEvent.bind(this));
    this.editor.coreEvents?.addListener(CoreEvents.HARD_RELOAD, this.hardReloadEvent.bind(this));
    this.editor.coreEvents?.addListener(CoreEvents.PAUSE_GAME, this.pauseGameEvent.bind(this));
    this.editor.coreEvents?.addListener(CoreEvents.STOP_GAME, this.stopGameEvent.bind(this));
    this.editor.coreEvents?.addListener(CoreEvents.UNPAUSE_GAME, this.unpauseGameEvent.bind(this));
    this.core = core;
  }

  get isPaused(): boolean {
    return this._isPaused;
  }

  public runEvents() {
    this.editor.coreEvents?.runEvents();
  }

  public hotReloadEvent(save: Save): void {
    const reg = this.ecsLibrary.registry;
    save.entities.forEach(({ id, components }) => {
      Object.entries(components).forEach(([componentName, params]) => {
        const ogComponent = save.components.find(({ name }) => name === componentName);
        if (!ogComponent) {
          throw new NfNotFound("Component: " + componentName + " not found in saved components");
        }
        const ecsEntity: Entity = this.getEntityFromEntityId(id);
        const ecsComponent = reg.getEntityComponent(ecsEntity, {
          name: componentName,
        });
        Object.entries(params).forEach(([paramName, paramValue]) => {
          const lastLoadedParam = this.lastLoadedSave.entities.find((e) => e.id === id)?.components[
            componentName
          ]?.[paramName];
          if (lastLoadedParam !== paramValue) ecsComponent[paramName] = paramValue;
        });
        reg.addComponent(ecsEntity, ecsComponent);
      });
    });
    this.lastLoadedSave = JSON.parse(JSON.stringify(save));
  }

  public hardReloadEvent(save: Save): void {
    const reg = this.ecsLibrary.registry;
    this.lastLoadedSave = JSON.parse(JSON.stringify(save));
    save.entities.forEach(({ id, components }) => {
      Object.entries(components).forEach(([componentName, params]) => {
        const ogComponent = save.components.find(({ name }) => name === componentName);
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

  public pauseGameEvent(): void {
    this._isPaused = true;
  }
  public unpauseGameEvent(): void {
    this._isPaused = false;
  }

  public stopGameEvent(): void {
    this.core.getExecutionContext().application.setIsRunning(false);
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
