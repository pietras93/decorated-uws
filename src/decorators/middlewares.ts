export const Before = (
  middleware: (req, res) => void
): MethodDecorator => {
  return (target: any, propertyKey: string): void => {
    if (!Reflect.hasMetadata("routes", target.constructor)) {
      Reflect.defineMetadata("routes", [], target.constructor);
    }

    const routes = Reflect.getMetadata(
      "routes",
      target.constructor
    );

    let routeData = routes.find(route => route.methodName === propertyKey);
    if (routeData) {
      routeData.before.push(middleware);
    } else {
      routes.push({ methodName: propertyKey, before: [middleware], after: [] });
    }

    Reflect.defineMetadata("routes", routes, target.constructor);
  };
};

export const After = (
  middleware: (req, response, status) => void
): MethodDecorator => {
  return (target: any, propertyKey: string): void => {
    if (!Reflect.hasMetadata("routes", target.constructor)) {
      Reflect.defineMetadata("routes", [], target.constructor);
    }

    const routes = Reflect.getMetadata(
      "routes",
      target.constructor
    );

    let routeData = routes.find(route => route.methodName === propertyKey);
    if (routeData) {
      routeData.after.push(middleware);
    } else {
      routes.push({ methodName: propertyKey, before: [], after: [middleware] });
    }

    Reflect.defineMetadata("routes", routes, target.constructor);
  };
};