import {
  type ApplicationContext,
  type IConfigRegistry,
  type IRunOptions,
  InitContext,
  type LibraryManager,
} from "@nanoforge-dev/common";

import { type EventEmitter } from "../event-emitter";

export class EditorInitContext extends InitContext {
  private readonly _eventEmitter: EventEmitter;

  constructor(
    context: ApplicationContext,
    libraryManager: LibraryManager,
    configRegistry: IConfigRegistry,
    options: IRunOptions,
    eventEmitter: EventEmitter,
  ) {
    super(context, libraryManager, configRegistry, options);
    this._eventEmitter = eventEmitter;
  }

  get eventEmitter(): EventEmitter {
    return this._eventEmitter;
  }
}
