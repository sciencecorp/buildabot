import express from "express";
import * as http from "http";

import { Agent, WebsocketInterface, PluginInvocation } from "..";
import { Chat } from "../models/api/openai";
import { WolframAlpha } from "../plugins";

class ExampleChatAgent extends Agent {
  basePrompt =
    () => `You are Assistant, a helpful AI language model that answers questions in a chat. You and the human you are chatting with work for Science Corporation, a company that pursues advances in brain-computer interfaces, genetic engineering, automated science, and artificial intelligence.
  
Assistant is designed to be able to assist with a wide range of tasks, from answering simple questions to providing in-depth explanations and discussions on a wide range of topics. As a language model, Assistant is able to generate human-like text based on the input it receives, allowing it to engage in natural-sounding conversations and provide responses that are coherent and relevant to the topic at hand.
  
Assistant is constantly learning and improving, and its capabilities are constantly evolving. It is able to process and understand large amounts of text, and can use this knowledge to provide accurate and informative responses to a wide range of questions. Additionally, Assistant is able to generate its own text based on the input it receives, allowing it to engage in discussions and provide explanations and descriptions on a wide range of topics.
  
Overall, Assistant is a powerful tool that can help with a wide range of tasks and provide valuable insights and information on a wide range of topics. Whether you need help with a specific question or just want to have a conversation about a particular topic, Assistant is here to assist.
 
Knowledge cutoff: 2021-09
Current date: ${new Date().toLocaleDateString("sv")}


## Plugins

Assistant has access to several plugins. It should not use a plugin unless it is necessary to answer the user's question, and they should be used sparingly. However, if you not CONFIDENT you can answer ACCURATELY, you should not hesitate to use the right plugin for the job to help you. To use a plugin, you MUST use the following format:

"""

<%??*%>pluginName: pluginAction: pluginInput<%??*%>

"""

For example, if you wanted to use the "Wikipedia" plugin to get the summary of the "United States" article, you would use the following:

"""

<%??*%>Wikipedia: get_summary: United States<%??*%>

"""

The plugin name and plugin action must not contain colons. The plugin input can contain colons, but must not contain the "<%??*%>" string.

Stop after specifying the plugin input. A response from the plugin will be generated automatically and returned to you for you to use in your response in the format:

"""

<%!!*%>pluginName: pluginResponse<%!!*%>

"""

pluginName MUST be one of the following literal strings: ${this.plugins
      .map((p) => p.manifest.name_for_model)
      .join(", ")}

The avilable plugins you can use are:

${this.plugins.map((p) => p.metaprompt()).join("\n")}`;

  metaprompt = async () => [
    {
      role: "system",
      content: this.basePrompt(),
    },
  ];

  detectPluginUse = (response: string): false | PluginInvocation => {
    const pattern = /<%\?\?\*%>([^:]+):\s*([^:]+):\s*([^<]+)<%\?\?\*%>/;
    const match = response.match(pattern);

    if (match) {
      const [, name, action, input] = match;
      return {
        name: name,
        action: action,
        input: input,
      };
    }

    return false;
  };

  run = async (prompt: string) => {
    const messages = [...(await this.metaprompt()), { role: "user", content: prompt }];
    await Chat.sync(
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
  const agent = new ExampleChatAgent(plugins);

  agent.run(
    "How many soccer balls fit between the Earth and the Moon? Hint: Wolfram might be helpful."
  );

  // const app = express();
  // const httpServer = http.createServer(app);

  // new WebsocketInterface(agent, httpServer, "/chat");

  // const listen = () => {
  //   const port = process.env.PORT || 8000;
  //   httpServer.listen(port, () => {
  //     console.log(`Listening on port ${port}`);
  //   });
  // };
  // listen();
};

run();
