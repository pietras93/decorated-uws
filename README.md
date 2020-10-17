# decorated-uws

Small decorator based framework based on UWS.js
**This project is currently in alpha stages. NOT READY for production use**

## Idea

Main goal of the project is to create modern wrapper on UWS.js library in order to achieve easy to use, yet fast framework.
Decorators are inspired by similar projects like [routing-controllers](https://github.com/typestack/routing-controllers) and [Nest](https://nestjs.com/). Moreover, [Fastify](https://www.fastify.io/) inspired optional optimizations are planned. [UWS.js](https://github.com/uNetworking/uWebSockets) provides also support for web socket communication, custom decorators that would add support are planned.

## Current stage

At this moment this library provides only very basic functionality.

## Usage

_index.ts_

```
import { App } from 'decorated-uws';
import { TestController } from './controller';

const app = new App({ controllers: [TestController] });
app.listen(3000);
```

_controller.ts_

```
import { Controller, Get } from 'decorated-uws';
@Controller('/')
class TestController {
  @Get('/')
  public get() {
    return { hello: 'world' };
  }
}
```

### App options

`controllers: Controller[]`: array of controllers decorated with `Controller` decorator
`key?: string`: filename of key file to use SSL
`cert?: string`: filename of cert file to use SSL
`passphrase?: string`: password for SSL key
`defaultBodyParser?: (data: Buffer) => any`: default request body parser, if none given, app will try to parse body as JSON
