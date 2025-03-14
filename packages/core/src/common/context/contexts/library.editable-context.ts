import { LibraryContext, type LibraryStatusEnum } from "@nanoforge/common";

export class EditableLibraryContext extends LibraryContext {
  setStatus(status: LibraryStatusEnum) {
    this._status = status;
  }
}
