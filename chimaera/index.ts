import express from "express";
import http from "http";
import { Browser, Daydream, Shell } from "../src/plugins";
import { ChimaeraDreamer } from "./daydreamer";
import { ChimaeraAgent } from "./agent";
import { WebsocketInterface } from "../src";

const run = async () => {
  const plugins = [new Browser(), new Shell(), new Daydream(new ChimaeraDreamer())];
  const agent = new ChimaeraAgent(plugins);
  agent.init();

  // agent.run("how many soccer players are there in the world?");
  // agent.run("create a new directory at /etc/var/foo");

  const app = express();
  const httpServer = http.createServer(app);

  new WebsocketInterface(agent, httpServer, "/chat");

  const listen = () => {
    const port = process.env.PORT || 8000;
    httpServer.listen(port, () => {
      console.log(`Listening on port ${port}`);
    });
  };
  listen();
};

run();
