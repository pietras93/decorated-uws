import * as uws from "uWebSockets.js";

import { Methods } from "enums/methods";

export class RequestUtils {
  private readonly req: uws.HttpRequest;
  public path: string;
  public method: Methods;
  public url: string;
  public headers: { [key: string]: string } = {};
  public query: { [key: string]: string } = {};
  public params: { [key: string]: string } = {};
  public body: any;

  constructor(req: uws.HttpRequest, path: string, queryParser: (queryString: string) => any) {
    this.req = req;
    this.path = path;
    this.method = this.req.getMethod() as Methods;
    this.url = this.req.getUrl();

    // Get headers
    this.req.forEach((key: string, value: string) => {
      this.headers[key] = value;
    });

    // Get query
    const queryString = this.req.getQuery();
    this.query = queryParser(queryString);

    // Get params
    const pathElements = this.path.split("/");
    let counter = 0;
    for (const element of pathElements) {
      if (element.substr(0, 1) === ":") {
        this.params[element.substr(1)] = this.req.getParameter(counter);
        counter++;
      }
    }
  }

  public header(key: string): string {
    return this.headers[key];
  }

  public param(key: string): string {
    return this.params[key];
  }

  public setData(data: Buffer, bodyParser: (data: Buffer) => any): void {
    try {
      this.body = bodyParser(data);
    } catch (err) {
      this.body = {};
      throw err;
    }
  }
}
