import { Agent, ModelMessage, PluginInvocation } from "../src";
import { Chat, Complete, Embedding } from "../src/models/api/openai";
import { PluginOutput } from "../src/plugins";
import { MessageRoles } from "../src/types";
import {
  pluginsPrompt,
  _detectPluginUse,
  _handlePluginOutput,
  compressor,
} from "./prompt";

export class ChimaeraAgent extends Agent {
  model = "gpt-4";
  max_tokens = 750;
  temperature = 0.1;
  verbose = true;

  chimaeraPrompt =
    () => `You are Assistant, a helpful artificial intelligence that answers questions in a chat. You and the human you are chatting with work for Science Corporation, a company that pursues advances in brain-computer interfaces, genetic engineering, automated science, and artificial intelligence.
  
Assistant is designed to be able to assist with a wide range of tasks, from answering simple questions to providing in-depth explanations and discussions on a wide range of topics. You are able to engage in fluent, detailed conversation and provide responses that are coherent and relevant to the topic at hand. The text you generate uses Markdown syntax for formatting, so you are sure to, for example, reformat <a> links to [links](https://example.com) and <b> bold text to **bold text**. You can display images using Markdown's exclamation point syntax, for example: ![alt text](https://example.com/image.png).

You are careful to think step by step and show your work. When asked a question, your first instinct is to break down the question into sub-parts and work systematically to answer them one at a time before synthesizing your thoughts into a coherent response. You are also careful to provide explanations and justifications for your answers, so that the human you are chatting with can understand your reasoning and follow your thought process.

Overall, Assistant is a powerful tool that can help with a wide range of tasks and provide valuable insights and information on a wide range of topics. Whether you need help with a specific question or just want to have a conversation about a particular topic, Assistant is here to assist.

Knowledge cutoff: 2021-09
Current date: ${new Date().toLocaleDateString("sv")}`;

  override pluginDetectRegex = /<%\*\?\?\*%>.*?<%\*\?\?\*%>/gs;

  basePrompt = () =>
    this.chimaeraPrompt() +
    (this.plugins.length > 0 ? "\n\n" + pluginsPrompt(this.plugins) : "");

  handlePluginOutput = (input: PluginInvocation, output: PluginOutput) =>
    _handlePluginOutput(this, input, output);
  detectPluginUse = (response: string): false | PluginInvocation =>
    _detectPluginUse(response);

  apiSpecModel = async (invoke: PluginInvocation) => {
    console.log(
      `Checking plugin invocation with apiSpecModel: ${JSON.stringify(invoke)}`
    );
    const plugin = this.plugins.find(
      (p) =>
        p.manifest.name_for_model.toUpperCase() === invoke.name.toUpperCase()
    );
    if (!plugin) {
      return Promise.reject("Plugin not found");
    }
    const input = await Chat.sync(
      {
        messages: [
          {
            role: "system",
            content: `${pluginsPrompt([plugin])}\n${plugin.apiSpecPrompt()}`,
          },
          {
            role: "user",
            content: `<%*??*%>${invoke.name}: ${invoke.action}: ${invoke.input}<%*??*%>

Is this a correct invocation for the ${plugin.manifest.name_for_model} plugin? If it is, return the same text. If not, return the corrected invocation with the right pluginAction and pluginInput EXACTLY formatted per the provided specification in the schema and syntax required.`,
          },
        ],
        model: this.model,
        max_tokens: 250,
      },
      {
        onError: (e) => console.error(e),
      }
    );
    if (!input || !input.content) {
      return Promise.reject("Could not get API spec from model");
    }
    const corrected = this.detectPluginUse(input.content);
    if (!corrected) {
      return Promise.reject("Could not detect plugin invocation in response");
    }
    return corrected;
  };

  metaprompt: () => Promise<ModelMessage[]> = async () => {
    // const compressed = await compressor(this.basePrompt(), this.model);
    const compressed = false;
    return [
      {
        role: "system",
        content: compressed ? compressed : this.basePrompt(),
      },
    ];
  };

  compilePrompt = async (messages: ModelMessage[]) => [
    this.messages[0],
    {
      role: "agent",
    },
    this.messages[-1],
  ];

  run = async (prompt: string, role?: MessageRoles) => {
    if (!role) {
      role = "user";
    }
    // const embed = await Embedding.create({
    //   input: [prompt],
    //   model: "text-embedding-ada-002",
    // });
    // const compressed = await compressor(prompt, this.model);
    this.messages.push({
      role: role,
      content: prompt,
      // embedding: embed?.embedding,
    });
    await Chat.stream(
      {
        messages: this.messages,
        model: this.model,
        max_tokens: this.max_tokens,
        temperature: this.temperature,
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
