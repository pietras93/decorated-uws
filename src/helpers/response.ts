import * as uws from "uWebSockets.js";
import { Readable, Writable } from "stream";

import { createReadStream, statSync } from "fs";

class ResponseWriteStream extends Writable {
  private readonly res: uws.HttpResponse;
  private readonly totalSize: number;

  constructor(res: uws.HttpResponse, totalSize: number) {
    super({ highWaterMark: 524288 });

    this.res = res;
    this.totalSize = totalSize;
  }

  awaitWrite(chunk: Buffer, writeOffset: number) {
    return new Promise((resolve) => {
      this.res.onWritable((lastOffset) => {
        let [ok, done] = this.res.tryEnd(
          chunk.slice(lastOffset - writeOffset),
          this.totalSize
        );

        resolve(done);

        return ok;
      });
    });
  }

  _write(chunk: any, encoding?: string, cb?: (err?: Error) => void): void {
    let lastOffset = this.res.getWriteOffset();
    let [ok, done] = this.res.tryEnd(chunk, this.totalSize);

    if (done) {
      this.emit("finish");
      cb();
    } else if (!ok) {
      this.awaitWrite(chunk, lastOffset)
        .then((done) => {
          if (done) {
            this.emit("finish");
          }
          cb();
        })
        .catch(cb);
    } else {
      cb();
    }
  }
}

export class Response {
  redirect: () => void;
  status: (number) => Response;
  set: () => Response;
  end: () => void;
  sendFile: () => void;
  send: (data: any) => void;
  json: (data: any) => void;
}

export class ResponseUtils {
  public response: Response = new Response();
  private readonly res: uws.HttpResponse;
  private resId: number = 0;
  public isFinished: boolean = false;

  constructor(res) {
    this.res = res;
    this.response.redirect = this.redirect.bind(this);
    this.response.status = this.status.bind(this);
    this.response.set = this.setHeaders.bind(this);
    this.response.end = this.end.bind(this);
    this.response.sendFile = this.sendFile.bind(this);
    this.response.send = this.sendData.bind(this);
    this.response.json = this.sendJson.bind(this);
  }

  onAbortedOrFinishedResponse(stream?: Readable): void {
    if (this.resId !== -1 && stream) {
      stream.destroy();
    }

    /* Mark this response already accounted for */
    this.resId = -1;
    this.isFinished = true;
  }

  private status(status): Response {
    this.res.writeStatus(status.toString());
    return this.routeResponse;
  }

  private setHeaders(key: string | Headers, value?: string): Response {
    if (typeof key === "string") {
      this.res.writeHeader(key, value);
    } else {
      for (const k in key) {
        if (key[k]) {
          this.res.writeHeader(k, key[k]);
        }
      }
    }

    return this.routeResponse;
  }

  private sendFile(path: string): void {
    const stats = statSync(path);
    const stream = createReadStream(path, { highWaterMark: 524288 });
    const output = new ResponseWriteStream(this.res, stats.size);

    stream.pipe(output).on("close", () => {
      this.isFinished = true;
    });
  }

  private sendData(data: Buffer | string | object): void {
    if (typeof data !== "string") {
      data = JSON.stringify(data);
    }

    this.res.cork(() => {
      this.res.write(Buffer.from(data));
      this.res.end();
    });
    this.isFinished = true;
  }

  public sendJson(data: object): void {
    //this.res.cork(() => {
    this.res.writeHeader("Content-type", "application/json; charset=utf-8");
    this.res.write(Buffer.from(JSON.stringify(data)));
    this.res.end();
    //});
    this.isFinished = true;
  }

  private redirect(url: string): void {
    this.res.cork(() => {
      this.res.writeStatus("302");
      this.res.writeHeader("location", url);
      this.res.end();
    });
    this.isFinished = true;
  }

  private end() {
    this.res.cork(() => {
      this.res.end();
    });
    this.isFinished = true;
  }

  get routeResponse(): Response {
    return this.response;
  }
}
