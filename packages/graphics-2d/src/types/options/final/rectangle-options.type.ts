import { type IVertex2D } from "../../common";
import { type IColorOption } from "../base/color.type";

export interface IRectangleOptions extends IColorOption {
  min: IVertex2D;
  max: IVertex2D;
}
