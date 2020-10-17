export interface AppOptions {
  controllers: Function[];
  cert?: string;
  key?: string;
  passphrase?: string;
  defaultBodyParser?: (data: Buffer) => any;
}

export interface RouteOptions {
  bodyParser?: (data: Buffer) => any;
}
