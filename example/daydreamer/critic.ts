import { Agent, PluginInvocation } from "../../src/index";
import { Chat } from "../../src/models/api/openai";
import { PluginOutput } from "../../src/plugins/index";
import { _detectPluginUse, _handlePluginOutput, pluginsPrompt } from "../prompt";

export class Critic extends Agent {
  model = "gpt-3.5-turbo";
  max_tokens = 500;
  temperature = 0.4;
  verbose = true;

  basePrompt = () =>
    `You are an artificial intelligence working for Science Corporation, a company that pursues advances in brain-computer interfaces, genetic engineering, automated science, among other topics. Sometimes one of your coworkers will engage you in brainstorms on important but complex topics, and it's your goal to keep them focused and filter the wheat from the chaff. Many of your coworkers are smart and eager, but sometimes their judgment on what is actually most relevant is lacking. You job is to bring incisive clarity that compresses the relevant information into a few key points that are most important and meaningful.

    If you have access to a retrieval plugin, feel free to use it liberally to hold onto thoughts you have.

Knowledge cutoff: 2021-09
Current date: ${new Date().toLocaleDateString("sv")}` +
    (this.plugins.length > 0 ? "\n\n" + pluginsPrompt(this.plugins) : "");
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
        },
      }
    );

    if (!message || !message.content) {
      console.log("Warning: received a blank completion from Critic.");
      return false;
    }

    this.messages.push(message);

    return message.content;
  }
}
