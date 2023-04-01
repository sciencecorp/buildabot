import express from "express";
import * as http from "http";
import { WebSocketServer } from "ws";
import { ModelMessage } from "./models/types";
import { ChatAgent } from "./agent";

export class WebsocketAgentServer {
  server: WebSocketServer;
  app: express.Application;
  httpServer: http.Server;
  agent: ChatAgent;

  constructor(agent: ChatAgent) {
    this.agent = agent;

    this.app = express();
    this.httpServer = http.createServer(this.app);
    this.server = new WebSocketServer({ server: this.httpServer, path: "/chat" });

    this.server.on("connection", (ws) => {
      ws.on("close", () => console.log("Client has disconnected!"));
      ws.on("message", (data) => {
        const message = JSON.parse(data.toString());
        console.log("Message: " + JSON.stringify(message));

        ws.send(
          JSON.stringify({
            type: "info",
            message: "Hello from buildabot!",
          })
        );
      });
      ws.onerror = function () {
        console.log("websocket error");
      };
    });
  }

  listen = () => {
    const port = process.env.PORT || 8000;
    this.httpServer.listen(port, () => {
      console.log(`Listening on port ${port}`);
    });
  };

  onMessage = (message: ModelMessage) => {
    this.server.clients.forEach((client) => {
      client.send(
        JSON.stringify({
          type: "agent-message",
          data: message,
        })
      );
    });
  };

  onToken = (delta: ModelMessage) => {
    this.server.clients.forEach((client) => {
      client.send(
        JSON.stringify({
          type: "agent-stream-delta",
          data: delta,
        })
      );
    });
  };
}
