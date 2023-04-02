import { Agent, Plugin, PluginInvocation } from "../src";
import { PluginOutput } from "../src/plugins";

export const pluginsPrompt = (plugins: Plugin[]) => `## Plugins

You have access to several plugins. To use a plugin, you must generate a response in the following format:

\`<%*??*%>pluginName: pluginAction: pluginInput<%*??*%>\`

For example, if you wanted to use the "Wikipedia" plugin to get the summary of the "United States" article, you would return the following:

\`<%*??*%>Wikipedia: get_summary: United States<%*??*%>\`

The plugin name and plugin action must not contain colons. The plugin input can contain colons, but must not contain the \`<%*??*%>\` string.

A response from the plugin will be generated automatically and returned to you for you to use in your response in the format as a system message:

\`<%*!!*%>pluginName: pluginAction: pluginResponse<%*!!*%>\`

You should NEVER generate text that include \`<%*!!*%>\` -- it will always be generated for you and given to you. If you generate \`<%*!!*%>\`, you are hallucinating and should not return that information.

pluginName MUST be one of the following literal strings: ${plugins
  .map((p) => p.manifest.name_for_model)
  .join(", ")}

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
