import { Browser, Shell } from "../src/plugins";
import { OpenApiPlugin } from "../src/plugins/openapi";
import { ChimaeraAgent } from "./agent";

const run = async () => {
  const plugins = [
    new Browser(),
    new Shell(),
    await OpenApiPlugin.fromUrl("https://www.wolframalpha.com/.well-known/ai-plugin.json"),
  ];
  const agent = new ChimaeraAgent(plugins);
  agent.init();

  agent.run("how many soccer players are there in the world?");
  // agent.run("create a new directory at /etc/var/foo");

  // const app = express();
  // const httpServer = http.createServer(app);

  // new WebsocketInterface(agent, httpServer, "/chat");

  // const listen = () => {
  //   const port = process.env.PORT || 8000;
  //   httpServer.listen(port, () => {
  //     console.log(`Listening on port ${port}`);
  //   });
  // };
  // listen();
};

run();
