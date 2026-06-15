import { type IRunOptions, NfNotFound } from "@nanoforge-dev/common";
import type { ECSClientLibrary, Entity } from "@nanoforge-dev/ecs-client";

import { EventEmitter } from "../common/context/event-emitter";
import { CoreEvents } from "../common/context/events/core-events";
import type { Save } from "../common/context/save.type";
import type { Core } from "../core/core";

export class CoreEditor {
  public eventEmitter: EventEmitter;
  private ecsLibrary: ECSClientLibrary;
  private lastLoadedSave: Save;
  private core: Core;
  private _isPaused: boolean = false;

  constructor(core: Core, editor: IRunOptions["editor"], ecsLibrary: ECSClientLibrary) {
    this.eventEmitter = new EventEmitter(editor);
    this.lastLoadedSave = JSON.parse(JSON.stringify(editor.save));
    this.ecsLibrary = ecsLibrary;
    this.eventEmitter.on(CoreEvents.HOT_RELOAD, this.hotReloadEvent.bind(this));
    this.eventEmitter.on(CoreEvents.HARD_RELOAD, this.hardReloadEvent.bind(this));
    this.eventEmitter.on(CoreEvents.PAUSE_GAME, this.pauseGameEvent.bind(this));
    this.eventEmitter.on(CoreEvents.STOP_GAME, this.stopGameEvent.bind(this));
    this.eventEmitter.on(CoreEvents.UNPAUSE_GAME, this.unpauseGameEvent.bind(this));
    this.core = core;
  }

  get isPaused(): boolean {
    return this._isPaused;
  }

  public runEvents() {
    this.eventEmitter.runEvents();
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
        .getComponents({ name: "__RESERVED_entityId" })
        // @todo There is an issue here, getIndex return index from 1 but entityFromIndex get index from 0
        // This is a temp fix
        .getIndex({ name: "__RESERVED_entityId", entityId: entityId }) - 1,
    );
  }
}
