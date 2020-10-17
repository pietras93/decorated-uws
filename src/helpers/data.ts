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

  static JSONParser(data: Buffer): any {
    try {
      return JSON.parse(data.toString());
    } catch (err) {
      throw new Error("Error parsing data");
    }
  }
}
