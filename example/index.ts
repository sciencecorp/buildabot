import express from "express";
import http from "http";
import { WebsocketInterface } from "../src";
import makeAgent from "./makeAgent";

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
