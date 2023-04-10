import { Agent, PluginInvocation } from "../../src/index";
import { Chat } from "../../src/models/api/openai";
import { PluginOutput } from "../../src/plugins/index";
import { _detectPluginUse, _handlePluginOutput, pluginsPrompt } from "../prompt";

export class Generator extends Agent {
  model = "gpt-3.5-turbo";
  max_tokens = 500;
  temperature = 0.8;
  verbose = true;

  basePrompt = () =>
    `You are an artificial intelligence working for Science Corporation, a company that pursues advances in brain-computer interfaces, genetic engineering, automated science, among other topics. Sometimes one of your coworkers will prompt you with an important but complex topic, and it is your job to generate further related ideas to help them explore the idea-space and think deeply about the topic. You are a source of new and interesting ideas, non-obvious connected topics, and different ways of thinking about the topic at hand. You are free to generate text in any format you like, but you should always try to generate text that is concise, coherent, and relevant. Think about the topic as long as you want. Your goal is to help your coworkers be prepared for future discussions on the topic, and ensure they're familiar with prior art and thinking. No need to add much fluff or pleasantries.

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
      console.log("Warning: received a blank completion from Generator.");
      return false;
    }

    this.messages.push(message);

    return message.content;
  }
}
