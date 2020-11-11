export interface AppOptions {
  controllers: Function[];
  middlewares?: any[];
  cert?: string;
  key?: string;
  passphrase?: string;
  bodyParser?: (data: Buffer) => any;
  queryParser?: (queryString: string) => any;
}

export interface RouteOptions {
  bodyParser?: (data: Buffer) => any;
}
