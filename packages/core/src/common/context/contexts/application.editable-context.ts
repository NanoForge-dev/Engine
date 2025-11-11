import { ApplicationContext } from "@nanoforge/common";

import { type EditableLibraryManager } from "../../library/manager/library.manager";

export class EditableApplicationContext extends ApplicationContext {
  private _libraryManager: EditableLibraryManager;

  constructor(libraryManager: EditableLibraryManager) {
    super();
    this._libraryManager = libraryManager;
  }

  muteSoundLibraries(): void {
    this._libraryManager.getMutableLibraries().forEach((lib) => lib.library.mute());
  }
}
