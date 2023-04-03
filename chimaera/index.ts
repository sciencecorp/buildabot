import express from "express";
import http from "http";
import { WebsocketInterface } from "../src";
import { Browser, Daydream, Shell } from "../src/plugins";
import { OpenApiPlugin } from "../src/plugins/openapi";
import { ChimaeraAgent } from "./agent";
import { ChimaeraDreamer } from "./daydreamer";

const run = async () => {
  const plugins = [
    new Browser(),
    new Shell(),
    new Daydream(new ChimaeraDreamer()),
    await OpenApiPlugin.fromUrl(
      "http://0.0.0.0:8000/.well-known/ai-plugin.json"
    ),
  ];
  const agent = new ChimaeraAgent(plugins);
  agent.init();

  // agent.run("how many soccer players are there in the world?");
  // agent.run("create a new directory at /etc/var/foo");

  const app = express();
  const httpServer = http.createServer(app);

  new WebsocketInterface(agent, httpServer, "/chat");

  const listen = () => {
    const port = process.env.PORT || 8765;
    httpServer.listen(port, () => {
      console.log(`Listening on port ${port}`);
    });
  };
  listen();
};

run();
