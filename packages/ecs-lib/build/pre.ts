import { Context } from "@nanoforge-dev/common";

export type Component = { name: string; [key: string]: any };

export type System = (registry: Registry, ctx: Context) => void;
