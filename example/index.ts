import { Controller, Get, Post, Body, Before, App, After } from "../dist";

@Controller("/")
class TestController {
  @Before((req, res) => { console.log(req.path, 'middleware') })
  @After((req, response, status) => { console.log(req.path, status) })
  @Get("")
  public get() {
    return { hello: "world" };
  }

  @Before((req, res) => { console.log(req.path, 'middleware') })
  @After((req, response, status) => { console.log(req.path, status) })
  @Get("/test")
  public getTest() {
    return { hello: "test" };
  }

  @Post("")
  public post(@Body() body: any) {
    return { received: body };
  }
}

const app = new App({ controllers: [TestController] });
app.listen();
