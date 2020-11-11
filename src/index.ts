import "reflect-metadata";
import * as uws from "uWebSockets.js";
import { Container } from "typedi";
import { Methods } from "./enums";
import {
  DataUtils,
  ParamsParser,
  RequestUtils,
  ResponseUtils,
} from "./helpers";
import { AppOptions } from "interfaces/options";

export class App {
  private readonly app: uws.TemplatedApp = null;
  private readonly routes: any[] = [];
  private readonly middlewares: any[] = [];
  private readonly bodyParser: (data: Buffer) => any = DataUtils.bodyParser;
  private readonly queryParser: (querystring: string) => any = DataUtils.queryParser;

  constructor(options: AppOptions = { controllers: [] }) {
    if (options.key && options.cert) {
      this.app = uws.SSLApp({
        cert_file_name: options.cert,
        key_file_name: options.key,
        passphrase: options.passphrase,
      });
    } else {
      this.app = uws.App();
    }

    if (!options.controllers) {
      options.controllers = [];
    }

    if (options.bodyParser) {
      this.bodyParser = options.bodyParser;
    }

    if (options.queryParser) {
      this.queryParser = options.queryParser;
    }

    if (options.middlewares) {
      this.middlewares = options.middlewares;
    }

    this.registerControllers(options.controllers);
  }

  public listen(port: number = 3000, callback?: (socket: any) => void): void {
    if (!callback) {
      callback = (_) => {};
    }

    for (const route of this.routes) {
      this.app[route.method](route.path, this.handleRoute(route));
      console.log(
        `Registering route [${route.method.toUpperCase()}] ${route.path}`
      );
    }

    this.app.listen(port, callback);
  }

  private registerControllers(controllers: any[]): void {
    for (const controller of controllers) {
      const instance: any = Container.get(controller);

      const params =
        (Reflect.getMetadata("params", controller) as {
          [key: string]: { name: string; type: string }[];
        }) || {};

      let prefix: string = Reflect.getMetadata("prefix", controller) || "";
      if (prefix.endsWith("/")) {
        prefix = prefix.slice(0, -1);
      }
      if (!prefix.startsWith("/")) {
        prefix = `/${prefix}`;
      }

      const routes /*: RouteMeta[]*/ = Reflect.getMetadata(
        "routes",
        controller
      );
      /*const middleware = Reflect.getMetadata("middleware", controller);

      if (!middleware.all) {
        middleware.all = [];
      }*/

      for (const route of routes) {
        const fullPath = !route.path
          ? prefix
          : route.path.startsWith("/")
          ? `${prefix}${route.path}`
          : `${prefix}/${route.path}`;
        this.routes.push({
          path: fullPath.split('//').join('/'),
          method: route.method,
          params: params[route.methodName],
          before: route.before,
          after: route.after,
          handler: async (...args) => instance[route.methodName](...args),
        });
      }
    }
  }

  private handleRoute(route: {
    params: any;
    path: string;
    method: Methods;
    handler: any;
    middlewares: any[];
    before: any[];
    after: any[];
    bodyParser?: (data: Buffer) => any;
  }) {
    return async (res: uws.HttpResponse, req: uws.HttpRequest) => {
      // Handle response object
      const responseUtils = new ResponseUtils(res);
      res.onAborted(() => responseUtils.onAbortedOrFinishedResponse);

      // Handle request object
      const request = new RequestUtils(req, route.path, this.queryParser);

      // Handle incoming data
      const data: Buffer = await DataUtils.readData(res);

      if (data && data.length) {
        try {
          request.setData(data, route.bodyParser || this.bodyParser);
        } catch (err) {
          responseUtils.response.status(400).send(err.message);
          return;
        }
      }

      const args = route.params?.length
        ? ParamsParser.parse(route.params, request, responseUtils.routeResponse)
        : [];

      // Run general middlewares
      for (const middleware of this.middlewares) {
        try {
          await middleware(request, responseUtils.routeResponse);
        } catch (err) {
          console.log(err);
          break;
        }
      }

      // Run before middlewares
      for (const middleware of route.before) {
        try {
          await middleware(request, responseUtils.routeResponse);
        } catch (err) {
          console.log(err);
          break;
        }
      }

      // Handle route
      let resp;
      let status = 200;
      try {
        resp = await route.handler(...args);
      } catch (err) {
        console.log(err);
        status = err.status || 500;
        resp = { error: err };
      }

      // If route was finished in other way fe. by accessing @Res
      // do not try to send anyhting
      if (responseUtils.isFinished) {
        return;
      }

      // Send data as JSON
      responseUtils.response.status(status.toString());
      responseUtils.sendJson(resp);

      // Run after middlewares
      for (const middleware of route.after) {
        try {
          await middleware(request, resp, status);
        } catch (err) {
          console.log(err);
        }
      }

      return;
    };
  }
}

export * from "./decorators";
