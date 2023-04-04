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
  verbose: boolean = false;
  pluginDetectRegex: RegExp | null = null;
  currentStreamingMessage: ModelMessage | null = null;
  apiSpecModel: (invoke: PluginInvocation) => Promise<PluginInvocation> = async (invoke) => invoke;

  constructor(plugins: Plugin[]) {
    this.plugins = plugins;
  }

  async init() {
    this.messages = [...(await this.metaprompt())];
  }

  metaprompt: () => Promise<ModelMessage[]> = async () => [
    {
      role: "system",
      content: this.basePrompt(),
    },
  ];

  filterPluginInvocation = (input: string): string => {
    if (!this.pluginDetectRegex) {
      return input;
    }
    return input.replace(this.pluginDetectRegex, "");
  };

  addHandler = (callbacks: AgentCallbacks) => this.handlers.push(callbacks);

  onError = (err: any) => {
    console.log("Error: " + JSON.stringify(err));
    this.handlers.forEach((h) => (h.onError ? h.onError(err.message) : null));
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
  onFinish = () => {
    if (this.currentStreamingMessage) {
      this.onMessage
        ? this.onMessage({
            role: this.currentStreamingMessage.role,
            content: this.currentStreamingMessage.content,
          })
        : null;
    }
    this.handlers.forEach((h) => (h.onFinish ? h.onFinish() : null));
  };
  onToken = (delta: ModelMessage) => {
    if (undefined === delta.content && undefined === delta.role) {
      return;
    }

    this.handlers.forEach((h) => (h.onToken ? h.onToken(delta) : null));

    if (!this.currentStreamingMessage) {
      this.currentStreamingMessage = {};
    }

    if (delta.role) {
      this.currentStreamingMessage.role = delta.role;
    } else if (delta.content && delta.content != undefined) {
      this.currentStreamingMessage.content += delta.content;
    }
  };

  onMessage = (msg: ModelMessage): void => {
    if (undefined === msg.content) {
      return;
    }

    this.messages.push(msg);

    if (this.verbose) {
      console.log(`Message: ${msg.content}`);
    }

    if (this.currentStreamingMessage) {
      this.currentStreamingMessage = null;
    } else {
      this.handlers.forEach((h) =>
        h.onMessage
          ? h.onMessage({
              role: msg.role,
              content: this.filterPluginInvocation(msg.content?.trim() || ""),
            })
          : null
      );
    }

    const pluginInvocation = this.detectPluginUse(msg.content);

    if (pluginInvocation) {
      const plugin = this.plugins.find((p) => p.manifest.name_for_model === pluginInvocation.name);
      if (plugin) {
        this.onPluginStart(pluginInvocation);

        this.apiSpecModel({
          name: plugin.manifest.name_for_model,
          action: pluginInvocation.action,
          input: pluginInvocation.input,
        })
          .then((expanded: PluginInvocation) => {
            plugin.run(expanded.action, pluginInvocation.input).then((result) => {
              if (result.error) {
                this.onPluginError(pluginInvocation, result.error);
              } else {
                this.onPluginMessage(pluginInvocation, result);
              }
              this.onPluginFinish(pluginInvocation);
            });
          })
          .catch(() => {
            this.onPluginError(pluginInvocation, "Failed to expand input with API spec model");
          });
      } else {
        this.onError(`No plugin found for ${pluginInvocation.name}`);
      }
    }
  };
}
