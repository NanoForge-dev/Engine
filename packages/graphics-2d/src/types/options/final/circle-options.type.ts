import { type IColorOption } from "../base/color.type";
import { type IPositionOption } from "../base/position.type";

export interface ICircleOptions extends IColorOption, IPositionOption {
  radius: number;
}
