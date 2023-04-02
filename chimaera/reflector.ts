import { Agent, PluginInvocation } from "../src";
import { Chat } from "../src/models/api/openai";
import { PluginOutput } from "../src/plugins";
import { reflectorPrompt, pluginsPrompt, _detectPluginUse, _handlePluginOutput } from "./prompt";

export class Reflector extends Agent {
  model = "gpt-3.5-turbo";
  max_tokens = 500;
  temperature = 0.5;
  verbose = true;

  basePrompt = () => reflectorPrompt() + "\n\n" + pluginsPrompt(this.plugins);
  handlePluginOutput = (input: PluginInvocation, output: PluginOutput) =>
    _handlePluginOutput(this, input, output);
  detectPluginUse = (response: string): false | PluginInvocation => _detectPluginUse(response);

  async run(prompt?: string) {
    if (prompt) {
      this.messages.push({
        role: "user",
        content: prompt,
      });
    }
    let done = false;
    while (!done) {
      const message = await Chat.sync(
        {
          messages: this.messages,
          model: this.model,
          max_tokens: this.max_tokens,
          temperature: this.temperature,
        },
        {
          onError: (error) => {
            console.log("Error: " + error);
            done = true;
          },
        }
      );

      if (!message.content) {
        console.log("Warning: received a blank completion from Reflector.");
        continue;
      }

      if (this.verbose) {
        console.log(`\nReflector: ${message.content}\n`);
      }

      this.messages.push(message);
    }
  }
}
