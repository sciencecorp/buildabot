import { Agent, Plugin, PluginInvocation } from "../src";
import { Chat } from "../src/models/api/openai";
import { PluginOutput } from "../src/plugins";

export const pluginsPrompt = (plugins: Plugin[]) => `## Plugins

You have access to several plugins. To use a plugin, you must generate a response in the following format:

<%*??*%>pluginName: pluginAction: pluginInput<%*??*%>

Here are some examples, which may or may not be valid for the plugins you have access to:

<%*??*%>Browser: search: how many neurons are in the human brain<%*??*%>
<%*??*%>retrieval: query: {"queries": [{"query": "an important fact to look up"}]}<%*??*%>
<%*??*%>daydream: an important topic<%*??*%>

The plugin name and plugin action must not contain colons. The plugin input can contain colons, but must not contain the <%*??*%> string.

The available plugins are:

${plugins.map((p) => p.metaprompt()).join("\n")}`;

export const _handlePluginOutput = (
  agent: Agent,
  input: PluginInvocation,
  output: PluginOutput
) => {
  if (output.error) {
    agent.run(
      `The plugin returned: ${input.name}: ${input.action} ERROR: ${output.error}`,
      "system"
    );
  } else {
    agent.run(`The plugin returned: ${input.name}: ${input.action}: ${output.output}`, "system");
  }
};

export const _detectPluginUse = (response: string): false | PluginInvocation => {
  const pattern = /<%\*\?\?\*%>([^:]+):\s*([^:]+):\s*([^<]+)<%\*\?\?\*%>/;
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

export const compressor = async (text_data: string, model: string = "gpt-4") => {
  const compressed = await Chat.sync({
    model: model,
    messages: [
      {
        role: "system",
        content: `Compress the following text to fit in a Tweet, and such that you (${model}) can reconstruct it as close as possible to the original. This is for yourself. Do not make it human readable. Abuse of language mixing, abbreviations, symbols (unicode and emojis) to aggressively compress it is all allowed, while still keeping ALL of the information to fully reconstruct it.

=== Text to compress ===\n${text_data}`,
      },
    ],
  });
  return compressed?.content;
};
