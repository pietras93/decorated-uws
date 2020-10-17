import { ParamsTypes } from "enums";

const ParamsDecorator = (
  type: ParamsTypes,
  opt?: string
): ParameterDecorator => {
  return (target: any, propertyKey: string, index: number): void => {
    let params: any = {};
    if (Reflect.hasMetadata("params", target.constructor)) {
      params = Reflect.getMetadata("params", target.constructor);
    }

    if (!params[propertyKey]) {
      params[propertyKey] = [];
    }

    params[propertyKey][index] = { opt, type };

    Reflect.defineMetadata("params", params, target.constructor);
  };
};

export const Req = () => ParamsDecorator(ParamsTypes.Req);
export const Res = () => ParamsDecorator(ParamsTypes.Res);
export const Headers = (opt?: string) =>
  ParamsDecorator(ParamsTypes.Headers, opt);
export const Params = (opt?: string) =>
  ParamsDecorator(ParamsTypes.Params, opt);
export const Query = (opt?: string) => ParamsDecorator(ParamsTypes.Query, opt);
export const Body = (opt?: string) => ParamsDecorator(ParamsTypes.Body, opt);
