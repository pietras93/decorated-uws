import { Service } from "typedi";

export const Controller = (prefix?: string): ClassDecorator => {
  return (target: any): void => {
    Reflect.defineMetadata("prefix", prefix || "", target);
    Service()(target);
  };
};
