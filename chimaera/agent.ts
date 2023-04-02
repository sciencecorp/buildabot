import { Agent, PluginInvocation } from "../src";
import { Chat } from "../src/models/api/openai";
import { PluginOutput } from "../src/plugins";
import { chimaeraPrompt, pluginsPrompt, _detectPluginUse, _handlePluginOutput } from "./prompt";

export class ChimaeraAgent extends Agent {
  basePrompt = () => chimaeraPrompt() + "\n\n" + pluginsPrompt(this.plugins);

  handlePluginOutput = (input: PluginInvocation, output: PluginOutput) =>
    _handlePluginOutput(this, input, output);
  detectPluginUse = (response: string): false | PluginInvocation => _detectPluginUse(response);

  run = async (prompt: string) => {
    this.messages.push({ role: "user", content: prompt });
    await Chat.sync(
      {
        messages: this.messages,
        model: "gpt-3.5-turbo",
        max_tokens: 500,
      },
      {
        onStart: this.onStart,
        onFinish: this.onFinish,
        onError: this.onError,
        onMessage: this.onMessage,
        onToken: this.onToken,
      }
    );
  };
}
