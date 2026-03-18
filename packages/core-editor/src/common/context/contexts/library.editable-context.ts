import { LibraryContext, type LibraryStatusEnum } from "@nanoforge-dev/common";

export class EditableLibraryContext extends LibraryContext {
  setStatus(status: LibraryStatusEnum) {
    this._status = status;
  }
}
