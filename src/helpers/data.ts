import * as uws from "uWebSockets.js";

export class DataUtils {
  static async readData(res: uws.HttpResponse): Promise<any> {
    return new Promise((resolve, reject) => {
      let buffer: Buffer;

      res.onData((chunk: ArrayBuffer, isLast: boolean) => {
        const part: Buffer = Buffer.from(chunk);
        if (part.length) {
          buffer = buffer
            ? Buffer.concat([buffer, part])
            : Buffer.concat([part]);
        }

        if (isLast) {
          if (!buffer) {
            return resolve();
          }

          return resolve(buffer);
        }
      });

      res.onAborted(reject);
    });
  }

  public static bodyParser(data: Buffer): any {
    try {
      return JSON.parse(data.toString());
    } catch (err) {
      throw new Error("Error parsing data");
    }
  }

  public static queryParser(queryString: string): any {
    const query: any = {};
    const queryElements = queryString.split("&");
    for (const element of queryElements) {
      const [key, value] = element.split("=");
      if (query[key]) {
        if (!Array.isArray(query[key])) {
          query[key] = [query[key]];
        }
        query[key].push(value);
      } else {
        query[key] = value
      }
    }

    return query;
  }
}
