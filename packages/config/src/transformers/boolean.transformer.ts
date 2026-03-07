import { Transform } from "class-transformer";

const transformStringToBoolean = ({ value }: { value: string }) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};

export const TransformToBoolean = () => Transform(transformStringToBoolean);
