import { ApplicationContext } from "@nanoforge-dev/common";

import { type EditableLibraryManager } from "../../library/manager/library.manager";

export class EditableApplicationContext extends ApplicationContext {
  private _libraryManager: EditableLibraryManager;

  constructor(libraryManager: EditableLibraryManager) {
    super();
    this._libraryManager = libraryManager;
  }

  setDelta(delta: number) {
    this._delta = delta;
  }

  muteSoundLibraries(): void {
    this._libraryManager.getMutableLibraries().forEach((lib) => lib.library.mute());
  }
}
