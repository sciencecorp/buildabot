import { ModelMessage } from "../models/types";
import { Plugin } from "../plugins";
import { PluginInvocation, PluginOutput } from "../plugins/types";
import { AgentCallbacks } from "./types";

export abstract class Agent {
  abstract basePrompt: () => string;
  abstract metaprompt: () => Promise<ModelMessage[]>;
  abstract detectPluginUse: (response: string) => false | PluginInvocation;
  abstract run(prompt: string): void;

  plugins: Plugin[] = [];
  handlers: AgentCallbacks[] = [];

  constructor(plugins: Plugin[]) {
    this.plugins = plugins;
  }

  addHandler = (callbacks: AgentCallbacks) => this.handlers.push(callbacks);

  onError = (err: any) => {
    console.log("Error: " + err);
    console.log("Error: " + err.message);
    this.handlers.forEach((h) => {
      if (h.onError) {
        h.onError(err);
      }
    });
  };

  onPluginStart = (plugin: PluginInvocation) =>
    this.handlers.forEach((h) => (h.onPluginStart ? h.onPluginStart(plugin) : null));
  onPluginFinish = (plugin: PluginInvocation) =>
    this.handlers.forEach((h) => (h.onPluginFinish ? h.onPluginFinish(plugin) : null));
  onPluginError = (plugin: PluginInvocation, err: any) =>
    this.handlers.forEach((h) => (h.onPluginError ? h.onPluginError(plugin, err) : null));
  onPluginMessage = (plugin: PluginInvocation, output: PluginOutput) =>
    this.handlers.forEach((h) => (h.onPluginMessage ? h.onPluginMessage(plugin, output) : null));

  onStart = () => this.handlers.forEach((h) => (h.onStart ? h.onStart() : null));
  onFinish = () => this.handlers.forEach((h) => (h.onFinish ? h.onFinish() : null));
  onToken = (delta: ModelMessage) =>
    this.handlers.forEach((h) => (h.onToken ? h.onToken(delta) : null));
  onMessage = (msg: ModelMessage): void => {
    if (undefined === msg.content) {
      return;
    }

    this.handlers.forEach((h) => {
      if (h.onMessage) {
        h.onMessage(msg);
      }
    });

    console.log(`Message from model: ${msg.content}`);

    const pluginInvocation = this.detectPluginUse(msg.content);
    if (pluginInvocation) {
      const plugin = this.plugins.find((p) => p.manifest.name_for_model === pluginInvocation.name);
      if (plugin) {
        console.log("Using plugin " + JSON.stringify(pluginInvocation));
        this.onPluginStart(pluginInvocation);
        plugin.run(pluginInvocation.action, pluginInvocation.input).then((result) => {
          this.onPluginMessage(pluginInvocation, result);
          this.onPluginFinish(pluginInvocation);
        });
      } else {
        console.log("No plugin found for " + pluginInvocation.name);
      }
    }
  };
}
