import { type IConfigRegistry, InitContext } from "@nanoforge-dev/common";
import { EditableApplicationContext } from "@nanoforge-dev/core/src/common/context/contexts/application.editable-context";
import { EditableLibraryManager } from "@nanoforge-dev/core/src/common/library/manager/library.manager";

import { ClientNetworkLibrary } from "../src/client.network.library";

describe("Client Network Library", () => {
  const library = new ClientNetworkLibrary();
  const libraryManager = new EditableLibraryManager();
  const appContext = new EditableApplicationContext(libraryManager);
  const configRegistry = {} as IConfigRegistry;
  const context = new InitContext(appContext, libraryManager, configRegistry, {
    // @ts-ignore
    canvas: null,
    files: new Map(),
  });

  it("Should throw if canvas is undefined", async () => {
    await expect(library.__init(context)).rejects.toThrow();
  });
});
