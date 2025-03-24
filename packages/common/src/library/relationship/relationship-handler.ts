export class RelationshipHandler {
  private readonly _dependencies: symbol[];
  private readonly _runBefore: symbol[];
  private readonly _runAfter: symbol[];

  /**
   * Constructor for RelationshipHandler
   *
   * @param dependencies - Dependencies of the library
   * @param runBefore - Libraries needed to run before this one
   * @param runAfter - Libraries needed to run after this one
   */
  constructor(dependencies: symbol[], runBefore: symbol[], runAfter: symbol[]) {
    this._dependencies = dependencies;
    this._runBefore = runBefore;
    this._runAfter = runAfter;
  }

  get dependencies(): symbol[] {
    return this._dependencies;
  }

  get runBefore(): symbol[] {
    return this._runBefore;
  }

  get runAfter(): symbol[] {
    return this._runAfter;
  }
}
