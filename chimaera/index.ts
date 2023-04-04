import express from "express";
import http from "http";
import { Plugin, WebsocketInterface } from "../src";
import { Browser, Daydream, Shell } from "../src/plugins";
import { OpenApiPlugin } from "../src/plugins/openapi";
import { ChimaeraAgent } from "./agent";
import { ChimaeraDreamer } from "./daydreamer";

async function makeAgent() {
  const retrievalPlugin = process.env.RETRIEVAL_PLUGIN_URL
    ? [await OpenApiPlugin.fromUrl(process.env.RETRIEVAL_PLUGIN_URL)]
    : [];

  const plugins: Plugin[] = [
    new Browser(),
    new Shell(),
    new Daydream(new ChimaeraDreamer(retrievalPlugin)),
    ...retrievalPlugin,
  ];

  const agent = new ChimaeraAgent(plugins);
  agent.init();

  return agent;
}

const run = async () => {
  const app = express();
  app.get("/", (req, res) => {
    if (req.query.token !== process.env.ACCESS_TOKEN) {
      res.status(401).send("Unauthorized");
      return;
    }

    res.send("science chimaera 0.2.0");
  });

  const httpServer = http.createServer(app);

  new WebsocketInterface(makeAgent, httpServer, "/chat");

  const listen = () => {
    const port = process.env.PORT || 8765;
    httpServer.listen(port, () => {
      console.log(`Listening on port ${port}`);
    });
  };
  listen();
};

run();
