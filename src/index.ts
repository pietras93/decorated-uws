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
  private readonly bodyParser: (data: Buffer) => any = DataUtils.JSONParser;

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

    if (options.defaultBodyParser) {
      this.bodyParser = options.defaultBodyParser;
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
          path: fullPath,
          method: route.method,
          params: params[route.methodName],
          /* middlewares: middleware.all.concat(
            middleware[route.methodName] || []
          ),*/
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
    bodyParser?: (data: Buffer) => any;
  }) {
    return async (res: uws.HttpResponse, req: uws.HttpRequest) => {
      // Handle response object
      const responseUtils = new ResponseUtils(res);
      res.onAborted(() => responseUtils.onAbortedOrFinishedResponse);

      // Handle request object
      const request = new RequestUtils(req, route.path);

      // Handle incoming data
      const data: Buffer = await DataUtils.readData(res);

      if (data && data.length) {
        try {
          request.setData(data, route.bodyParser || this.bodyParser);
        } catch (err) {
          responseUtils.response.status(400).send(err.message);
          responseUtils.routeResponse.emit("finish");
          return;
        }
      }

      const args = route.params?.length
        ? ParamsParser.parse(route.params, request, responseUtils.routeResponse)
        : [];

      // Run middlewares
      /*const middlewares: any[] = this.middlewares.concat(route.middlewares);
      let error = false;

      for (const middleware of middlewares) {
        await middleware(request, responseUtils.routeResponse, err => {
          error = err;
        });
        if (error) {
          console.log("fak");
          break;
        }
      }*/

      // Handle route
      const resp = await route.handler(...args);

      // If route was finished in other way fe. by accessing @Res
      // do not try to send anyhting
      if (responseUtils.isFinished) {
        responseUtils.routeResponse.emit("finish");
        return;
      }

      // Send data as JSON
      responseUtils.sendJson(resp);
      responseUtils.routeResponse.emit("finish");

      return;
    };
  }
}

export * from "./decorators";
