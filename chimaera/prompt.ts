import { Agent, Plugin, PluginInvocation } from "../src";
import { PluginOutput } from "../src/plugins";

export const pluginsPrompt = (plugins: Plugin[]) => `## Plugins

You have access to several plugins. To use a plugin, you must generate a response in the following format:

\`<%*??*%>pluginName: pluginAction: pluginInput<%*??*%>\`

For example, if you wanted to use the "Browser" plugin to search for "how many neurons are in the human brain", you would return the following:

\`<%*??*%>Browser: search: how many neurons are in the human brain<%*??*%>\`

The plugin name and plugin action must not contain colons. The plugin input can contain colons, but must not contain the \`<%*??*%>\` string.

The avilable plugins you can use are:

${plugins.map((p) => p.metaprompt()).join("\n")}`;

export const _handlePluginOutput = (
  agent: Agent,
  input: PluginInvocation,
  output: PluginOutput
) => {
  if (output.error) {
    agent.messages.push({
      role: "system",
      content: `<%*!!*%>${output.name}: ERROR: ${output.error}<%*!!*%>`,
    });
  } else {
    agent.messages.push({
      role: "system",
      content: `<%*!!*%>${output.name}: ${input.action}: ${output.output}<%*!!*%>`,
    });
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
