import { Methods } from "enums";

export interface RouteMeta {
  path: string;
  method: Methods;
  methodName: string;
  before?: Array<(req: any, res: any) => void>;
  after?: Array<(req: any, res: any) => void>;
  bodyParser?: (data: Buffer) => any;
}
