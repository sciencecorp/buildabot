import chalk from "chalk";
import readline from "node:readline";
import { Agent } from "../agent";
import { ModelMessage } from "../models/types";
import { PluginInvocation, PluginOutput } from "../plugins/types";

export class CliInterface {
  agent: Agent;

  constructor(agent: Agent) {
    this.agent = agent;

    const handlers = {
      onToken: (delta: ModelMessage) => this.emitToken(delta),
      onError: (err: string) => console.error("error", err),
      onFinish: () => {
        console.log();
        rl.prompt();
      },
      onPluginStart: (plugin: PluginInvocation) =>
        console.log("plugin start", plugin),
      onPluginFinish: (plugin: PluginInvocation) =>
        console.log("plugin finish", plugin),
      onPluginError: (plugin: PluginInvocation, err: string) =>
        console.error("plugin error", plugin, err),
      onPluginMessage: (plugin: PluginInvocation, output: PluginOutput) =>
        console.log("plugin message", plugin, output),
    };
    this.agent.addHandler(handlers);
    this.agent.verbose = false;

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: "user: ",
    });

    rl.prompt();

    rl.on("line", async (line: string) => {
      this.agent.run(line, "user");
    }).on("close", () => {
      process.exit(0);
    });
  }

  emitToken(delta: ModelMessage) {
    if (delta.role) {
      process.stdout.write(`${delta.role}: `);
    }

    if (delta.content) {
      process.stdout.write(chalk.green(delta.content));
    }
  }
}
