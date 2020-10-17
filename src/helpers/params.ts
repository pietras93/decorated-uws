import { ParamsTypes } from "enums";

export class ParamsParser {
  static parse(params: any, req, res) {
    const args = [];
    for (const param of params) {
      switch (param.type) {
        case ParamsTypes.Req:
          args.push(req);
          break;
        case ParamsTypes.Res:
          args.push(res);
          break;
        case ParamsTypes.Headers:
          if (param.opt) {
            args.push(req.headers[param.opt]);
          } else {
            args.push(req.headers);
          }
          break;
        case ParamsTypes.Params:
          if (param.opt) {
            args.push(req.params[param.opt]);
          } else {
            args.push(req.params);
          }
          break;
        case ParamsTypes.Query:
          if (param.opt) {
            args.push(req.query[param.opt]);
          } else {
            args.push(req.query);
          }
          break;
        case ParamsTypes.Body:
          if (param.opt) {
            args.push(req.body[param.opt]);
          } else {
            args.push(req.body);
          }
          break;
      }
    }

    return args;
  }
}
