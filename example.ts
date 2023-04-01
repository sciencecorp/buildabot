import { ChatAgent, WebsocketAgentServer, Plugin, PluginInvocation, ModelMessage } from "./src";
import { Chat } from "./src/models/api/openai";
import { WolframAlpha } from "./src/plugins";

class Chimaera extends ChatAgent {
  basePrompt =
    () => `You are Assistant, a helpful AI language model that answers questions in a chat. You and the human you are chatting with work for Science Corporation, a company that pursues advances in brain-computer interfaces, genetic engineering, automated science, and artificial intelligence.
  
Assistant is designed to be able to assist with a wide range of tasks, from answering simple questions to providing in-depth explanations and discussions on a wide range of topics. As a language model, Assistant is able to generate human-like text based on the input it receives, allowing it to engage in natural-sounding conversations and provide responses that are coherent and relevant to the topic at hand.
  
Assistant is constantly learning and improving, and its capabilities are constantly evolving. It is able to process and understand large amounts of text, and can use this knowledge to provide accurate and informative responses to a wide range of questions. Additionally, Assistant is able to generate its own text based on the input it receives, allowing it to engage in discussions and provide explanations and descriptions on a wide range of topics.
  
Overall, Assistant is a powerful tool that can help with a wide range of tasks and provide valuable insights and information on a wide range of topics. Whether you need help with a specific question or just want to have a conversation about a particular topic, Assistant is here to assist.
 
Knowledge cutoff: 2021-09
Current date: 2023-03-31


## Plugins

Assistant has access to several plugins. It should not use a plugin unless it is necessary to answer the user's question, and they should be used sparingly. However, if you not CONFIDENT you can answer ACCURATELY, you should not hesitate to use the right plugin for the job to help you. To use a plugin, you MUST use the following format:

"""

<|UsePlugin|> (ONLY the name of the plugin to use, MUST be one of [${this.plugins
      .map((p) => p.manifest.name_for_model)
      .join(", ")})
<|PluginAction|> (the action to perform on the plugin drawn from the API spec, if available)
<|ActionInput|> (the input to the action as text based on the instructions in the plugin prompt)

"""

For example, if you wanted to use the "Wikipedia" plugin to get the summary of the "United States" article, you would use the following:

"""

<|UsePlugin|> Wikipedia
<|PluginAction|> get_summary
<|ActionInput|> United States

"""

Stop after specifying the action input. A response from the plugin will be generated automatically and returned to you for you to use in your response in the format:

"""

<|PluginUsed|> [plugin name]
<|PluginOutput|> [plugin response]

"""

The plugins are:

${this.plugins.map((p) => p.metaprompt()).join("\n")}`;

  metaprompt = async () => [
    {
      role: "system",
      content: this.basePrompt(),
    },
  ];

  detectPluginUse = (response: string): false | PluginInvocation => {
    const lines = response.split("\n");
    const pluginLine = lines.find((line) => line.startsWith("<|UsePlugin|>"));
    const actionLine = lines.find((line) => line.startsWith("<|PluginAction|>"));
    const actionInputLine = lines.find((line) => line.startsWith("<|ActionInput|>"));
    if (undefined === pluginLine || undefined === actionLine || undefined === actionInputLine) {
      return false;
    }
    return {
      plugin_name: pluginLine.split("|>")[1].trim(),
      plugin_action: actionLine.split("|>")[1].trim(),
      action_input: actionInputLine.split("|>")[1].trim(),
    };
  };

  run = async (prompt: string) => {
    const messages = [...(await this.metaprompt()), { role: "user", content: prompt }];
    await Chat.stream(
      {
        messages: messages,
        model: "gpt-3.5-turbo",
        max_tokens: 150,
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

const run = async () => {
  const plugins = [await WolframAlpha.init()];
  const chimaera = new Chimaera(plugins);
  const server = new WebsocketAgentServer(chimaera);
  server.listen();
};

run();
