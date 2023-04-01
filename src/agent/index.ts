import { ModelMessage } from "../models/types";
import { Plugin } from "../plugins";
import { PluginInvocation } from "../plugins/types";
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

    const usePlugin = this.detectPluginUse(msg.content);
    if (usePlugin) {
      const plugin = this.plugins.find((p) => p.manifest.name_for_model === usePlugin.plugin_name);
      if (plugin) {
        plugin.run(usePlugin.plugin_action, usePlugin.action_input);
      } else {
        console.log("No plugin found for " + usePlugin.plugin_name);
      }
    }
  };
}
