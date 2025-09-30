import { Expose, Transform, plainToInstance } from "class-transformer";
import { IsIP, IsInt, IsOptional, IsPort, validate } from "class-validator";

class Config {
  @Expose()
  @IsIP("4")
  @IsOptional()
  NETWORK_IP: string;

  @Expose()
  @IsPort()
  NETWORK_PORT: string;

  @Expose()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  NETWORK_TEST: number;
}
const test = async () => {
  console.log("\n");
  const data = plainToInstance(
    Config,
    {
      NETWORK_IP: "127.0.0.1",
      NETWORK_PORT: "8080",
      NETWORK_TEST: "10",
    },
    { excludeExtraneousValues: true },
  );
  const errors = await validate(data);
  console.log(errors);
  console.log(data);
};

test();
