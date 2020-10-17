import { Controller, Get, Post, Body, App } from "../dist";

@Controller("/")
class TestController {
  @Get("")
  public get() {
    return { hello: "world" };
  }

  @Post("")
  public post(@Body() body: any) {
    return { received: body };
  }
}

const app = new App({ controllers: [TestController] });
app.listen();
