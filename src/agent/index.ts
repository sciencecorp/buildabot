import { ModelMessage } from "../models/types";
import { Plugin } from "../plugins";
import { PluginInvocation } from "../plugins/types";

export abstract class ChatAgent {
  abstract basePrompt: () => string;
  abstract metaprompt: () => Promise<ModelMessage[]>;
  abstract detectPluginUse: (response: string) => false | PluginInvocation;
  abstract run(prompt: string): void;

  plugins: Plugin[] = [];

  constructor(plugins: Plugin[]) {
    this.plugins = plugins;
  }

  onError = (err: any) => {
    console.log("Error: " + err);
    console.log("Error: " + err.message);
  };

  onMessage = (msg: ModelMessage): void => {
    if (undefined === msg.content) {
      return;
    }
    const usePlugin = this.detectPluginUse(msg.content);
    if (usePlugin) {
      console.log("Detected plugin use: " + JSON.stringify(usePlugin));
    } else {
      console.log("Message: " + JSON.stringify(msg));
    }
  };
}
