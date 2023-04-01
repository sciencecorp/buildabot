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

    this.agent.addHandler({
      onMessage: this.onMessage,
      onToken: this.onToken,
      onError: this.onError,
      onStart: this.onStart,
      onFinish: this.onFinish,
    });

    this.server.on("connection", (ws) => {
      ws.on("close", () => console.log("Client has disconnected!"));
      ws.on("message", (data) => {
        const message = JSON.parse(data.toString());
        this.agent.run(message.content);
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

  onStart = () => {
    this.server.clients.forEach((client) => {
      client.send(
        JSON.stringify({
          type: "agent-start",
        })
      );
    });
  };

  onFinish = () => {
    this.server.clients.forEach((client) => {
      client.send(
        JSON.stringify({
          type: "agent-finish",
        })
      );
    });
  };

  onError = (err: string) => {
    this.server.clients.forEach((client) => {
      client.send(
        JSON.stringify({
          type: "agent-error",
          data: err,
        })
      );
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
