import express from "express";
import http from "http";
import { WebsocketInterface } from "../src";
import { Browser, Daydream, Shell } from "../src/plugins";
import { OpenApiPlugin } from "../src/plugins/openapi";
import { ChimaeraAgent } from "./agent";
import { ChimaeraDreamer } from "./daydreamer";

const run = async () => {
  const plugins = [new Browser(), new Shell(), new Daydream(new ChimaeraDreamer())];

  if (process.env.RETRIEVAL_PLUGIN_URL) {
    plugins.push(await OpenApiPlugin.fromUrl(process.env.RETRIEVAL_PLUGIN_URL));
  }

  const agent = new ChimaeraAgent(plugins);
  agent.init();

  const app = express();
  app.get("/", (req, res) => {
    if (req.query.token !== process.env.ACCESS_TOKEN) {
      res.status(401).send("Unauthorized");
      return;
    }

    res.send("science chimaera 0.2.0");
  });

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
