import { ModelMessage } from "../models/types";
import { PluginInvocation, PluginOutput } from "../plugins";

export interface AgentCallbacks {
  onStart?: () => void;
  onFinish?: () => void;
  onError?: (error: string) => void;
  onToken?: (delta: ModelMessage) => void;
  onMessage?: (message: ModelMessage) => void;

  onPluginStart?: (plugin: PluginInvocation) => void;
  onPluginFinish?: (plugin: PluginInvocation) => void;
  onPluginMessage?: (plugin: PluginInvocation, output: PluginOutput) => void;
  onPluginError?: (plugin: PluginInvocation, error: string) => void;
}
