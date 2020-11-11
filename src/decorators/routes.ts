import { Methods } from "enums";
import { RouteOptions } from "interfaces/options";
import { RouteMeta } from "interfaces/route-meta";

const RouteDecorator = (
  method: Methods,
  path: string,
  options?: RouteOptions
): MethodDecorator => {
  return (target: any, propertyKey: string): void => {
    if (!Reflect.hasMetadata("routes", target.constructor)) {
      Reflect.defineMetadata("routes", [], target.constructor);
    }

    const routes = Reflect.getMetadata(
      "routes",
      target.constructor
    ) as RouteMeta[];

    let routeData = routes.find(route => route.methodName === propertyKey);
    if (routeData) {
      routeData.path = path;
      routeData.method = method;
      if (options?.bodyParser) {
        routeData.bodyParser = options.bodyParser;
      }
    } else {
      const route: RouteMeta = {
        path,
        method,
        methodName: propertyKey,
        before: [],
        after: [],
      };
      
      if (options?.bodyParser) {
        route.bodyParser = options.bodyParser;
      }

      routes.push(route);
    }

    Reflect.defineMetadata("routes", routes, target.constructor);
  };
};

export const Get = (path: string, options?: RouteOptions) =>
  RouteDecorator(Methods.Get, path, options);
export const Post = (path: string, options?: RouteOptions) =>
  RouteDecorator(Methods.Post, path, options);
export const Put = (path: string, options?: RouteOptions) =>
  RouteDecorator(Methods.Put, path, options);
export const Patch = (path: string, options?: RouteOptions) =>
  RouteDecorator(Methods.Patch, path, options);
export const Delete = (path: string, options?: RouteOptions) =>
  RouteDecorator(Methods.Delete, path, options);
export const Head = (path: string, options?: RouteOptions) =>
  RouteDecorator(Methods.Head, path, options);
export const Options = (path: string, options?: RouteOptions) =>
  RouteDecorator(Methods.Options, path, options);
