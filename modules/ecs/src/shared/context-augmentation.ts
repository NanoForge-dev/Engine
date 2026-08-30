import type { EcsContextApi } from "./ecs-context.type";

declare module "@nanoforge-dev/common" {
  interface Context {
    ecs: EcsContextApi;
  }
}
