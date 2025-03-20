import { ShadersEnum } from "./shaders.enum";

export const SHADER_PATHS: Record<ShadersEnum, string> = {
  // [ShadersEnum.RECTANGLE]: "rectangle.wgsl",
  [ShadersEnum.CIRCLE]: "circle.wgsl",
};

export const SHADER_NAMES: Record<ShadersEnum, string> = {
  // [ShadersEnum.RECTANGLE]: "Rectangle shader",
  [ShadersEnum.CIRCLE]: "Circle shader",
};
