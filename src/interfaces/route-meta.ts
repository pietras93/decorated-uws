import { Methods } from "enums";

export interface RouteMeta {
  path: string;
  method: Methods;
  methodName: string;
  bodyParser?: (data: Buffer) => any;
}
