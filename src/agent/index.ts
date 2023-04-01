import { ModelCallbacks, ModelMessage } from "../models/types";
import { Plugin } from "../plugins";
import { PluginInvocation } from "../plugins/types";

export abstract class ChatAgent {
  abstract basePrompt: () => string;
  abstract metaprompt: () => Promise<ModelMessage[]>;
  abstract detectPluginUse: (response: string) => false | PluginInvocation;
  abstract run(prompt: string): void;

  plugins: Plugin[] = [];
  handlers: ModelCallbacks[] = [];

  constructor(plugins: Plugin[]) {
    this.plugins = plugins;
  }

  addHandler = (callbacks: ModelCallbacks) => this.handlers.push(callbacks);

  onError = (err: any) => {
    console.log("Error: " + err);
    console.log("Error: " + err.message);
    this.handlers.forEach((h) => {
      if (h.onError) {
        h.onError(err);
      }
    });
  };

  onStart = () => {
    this.handlers.forEach((h) => {
      if (h.onStart) {
        h.onStart();
      }
    });
  };

  onFinish = () => {
    this.handlers.forEach((h) => {
      if (h.onFinish) {
        h.onFinish();
      }
    });
  };

  onToken = (delta: ModelMessage) => {
    this.handlers.forEach((h) => {
      if (h.onToken) {
        h.onToken(delta);
      }
    });
  };

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
