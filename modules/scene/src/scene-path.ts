import { NfException } from "@nanoforge-dev/common";

import type { SceneClass } from "./scene";

type AnySceneClass = SceneClass<never>;

/** Thrown when a scene ends up among its own parents. */
export class NfSceneCycleException extends NfException {
  get code(): number {
    return 400;
  }

  /** @param scene - The scene found among its own parents. */
  constructor(scene: AnySceneClass) {
    super(`Scene - ${scene.name} is among its own parents.`);
  }
}

/**
 * The chain of scenes, root first, that loading `target` leads to.
 *
 * @remarks
 * Walks up `parent` (or `parentOverride` for the first step) until it
 * reaches a loaded scene: from there, the chain is the loaded one (a loaded
 * scene keeps the parent it was loaded under). A loaded `target` without an
 * override is the loaded chain up to it.
 *
 * @param target - The scene asked for.
 * @param parentOverride - The parent given to this load, if any.
 * @param loaded - The loaded chain, root first.
 * @throws `NfSceneCycleException` When a scene is among its own parents.
 */
export const resolvePath = (
  target: AnySceneClass,
  parentOverride: AnySceneClass | undefined,
  loaded: readonly AnySceneClass[],
): AnySceneClass[] => {
  if (!parentOverride) {
    const index = loaded.indexOf(target);
    if (index >= 0) return loaded.slice(0, index + 1);
  }

  const up = [target];
  let parent = parentOverride ?? target.parent;
  while (parent) {
    if (up.includes(parent)) throw new NfSceneCycleException(parent);
    const index = loaded.indexOf(parent);
    if (index >= 0) {
      const base = loaded.slice(0, index + 1);
      const cycle = up.find((scene) => base.includes(scene));
      if (cycle) throw new NfSceneCycleException(cycle);
      return [...base, ...up.reverse()];
    }
    up.push(parent);
    parent = parent.parent;
  }
  return up.reverse();
};

/** What a move from one chain of scenes to another does. */
export interface ScenePlan {
  /** Scenes to unload, deepest first. */
  unload: AnySceneClass[];
  /** Scenes to load, root first. */
  load: AnySceneClass[];
}

/**
 * Plans the move from the loaded chain to `path`: unload up to the deepest
 * scene both share, then load down to the end of `path`.
 */
export const planMove = (
  loaded: readonly AnySceneClass[],
  path: readonly AnySceneClass[],
): ScenePlan => {
  let shared = 0;
  while (shared < loaded.length && shared < path.length && loaded[shared] === path[shared]) {
    shared++;
  }
  return { unload: loaded.slice(shared).reverse(), load: path.slice(shared) };
};
