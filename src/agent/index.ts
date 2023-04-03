import { ModelMessage } from "../models/types";
import { Plugin } from "../plugins";
import { PluginInvocation, PluginOutput } from "../plugins/types";
import { MessageRoles } from "../types";
import { AgentCallbacks } from "./types";

export abstract class Agent {
  abstract basePrompt: () => string;
  abstract detectPluginUse: (response: string) => false | PluginInvocation;
  abstract handlePluginOutput: (input: PluginInvocation, output: PluginOutput) => void;
  abstract run(prompt: string, role?: MessageRoles): void;

  plugins: Plugin[] = [];
  handlers: AgentCallbacks[] = [];
  messages: ModelMessage[] = [];

  constructor(plugins: Plugin[]) {
    this.plugins = plugins;
  }

  init() {
    this.messages = [...this.metaprompt()];
  }

  metaprompt: () => ModelMessage[] = () => [
    {
      role: "system",
      content: this.basePrompt(),
    },
  ];

  addHandler = (callbacks: AgentCallbacks) => this.handlers.push(callbacks);

  onError = (err: any) => {
    console.log("Error: " + err);
    console.log("Error: " + err.message);
    this.handlers.forEach((h) => (h.onError ? h.onError(err) : null));
  };

  onPluginStart = (input: PluginInvocation) =>
    this.handlers.forEach((h) => (h.onPluginStart ? h.onPluginStart(input) : null));
  onPluginFinish = (input: PluginInvocation) =>
    this.handlers.forEach((h) => (h.onPluginFinish ? h.onPluginFinish(input) : null));
  onPluginError = (input: PluginInvocation, err: any) =>
    this.handlers.forEach((h) => (h.onPluginError ? h.onPluginError(input, err) : null));
  onPluginMessage = (input: PluginInvocation, output: PluginOutput) => {
    this.handlePluginOutput(input, output);
    this.handlers.forEach((h) => (h.onPluginMessage ? h.onPluginMessage(input, output) : null));
  };

  onStart = () => this.handlers.forEach((h) => (h.onStart ? h.onStart() : null));
  onFinish = () => this.handlers.forEach((h) => (h.onFinish ? h.onFinish() : null));
  onToken = (delta: ModelMessage) =>
    this.handlers.forEach((h) => (h.onToken ? h.onToken(delta) : null));
  onMessage = (msg: ModelMessage): void => {
    if (undefined === msg.content) {
      return;
    }

    this.handlers.forEach((h) => (h.onMessage ? h.onMessage(msg) : null));

    this.messages.push(msg);
    console.log(`Message: ${msg.content}`);

    const pluginInvocation = this.detectPluginUse(msg.content);
    if (pluginInvocation) {
      const plugin = this.plugins.find((p) => p.manifest.name_for_model === pluginInvocation.name);
      if (plugin) {
        this.onPluginStart(pluginInvocation);
        plugin.run(pluginInvocation.action, pluginInvocation.input).then((result) => {
          if (result.error) {
            this.onPluginError(pluginInvocation, result.error);
          } else {
            this.onPluginMessage(pluginInvocation, result);
          }
          this.onPluginFinish(pluginInvocation);
        });
      } else {
        this.onError(`No plugin found for ${pluginInvocation.name}`);
      }
    }
  };
}
