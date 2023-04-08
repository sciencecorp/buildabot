import {
  Agent,
  ModelChatRequest,
  ModelMessage,
  Plugin,
  PluginInvocation,
} from "../src";
import { Chat } from "../src/models/api/openai";
import { PluginOutput } from "../src/plugins";

export const pluginsPrompt = (plugins: Plugin[]) => `## Plugins

You have access to several plugins. To use a plugin, you must generate a response in the following format:

<%*??*%>pluginName: pluginAction: pluginInput<%*??*%>

Here are some examples, which may or may not be valid for the plugins you have access to:

<%*??*%>Browser: search: how many neurons are in the human brain<%*??*%>
<%*??*%>Retrieval: query: {"queries": [{"query": "an important fact to look up"}]}<%*??*%>
<%*??*%>Daydream: an important topic<%*??*%>

The plugin name and plugin action must not contain colons. The plugin input can contain colons, but must not contain the <%*??*%> string. When asked about your plugins, you should NEVER use the <%*??*%> string unless you intend to actually trigger a plugin! Use <plugin></plugin> instead if you must.

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
    agent.run(
      `The plugin returned: ${input.name}: ${input.action}: ${output.output}`,
      "system"
    );
  }
};

export const _detectPluginUse = (
  response: string
): false | PluginInvocation => {
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

export function chatCompressionRequest(
  chat_data: ModelMessage[],
  token_limit: number = 2000,
  model: string = "gpt-4"
): ModelChatRequest {
  return {
    model: model,
    temperature: 0,
    max_tokens: token_limit,
    messages: [
      {
        role: "system",
        content: `What follows is a chat log between the user and you (${model}). Your task is to produce a new 'system' prompt for a new chat session, which should include 2 distinct parts:

        1. A short, human-readable system prompt that primes the next session. This should prepare you to read the compressed context that follows, and include any directives from the original session's system prompt you will need to know who you are and what your purpose is.
        
        2. A compressed context such that you can reconstruct it as close as possible to the original and continue the conversation. This is for yourself and will never be shown to the user. Do not make it human readable. Abuse of language mixing, abbreviations, and symbols to aggressively compress it is all allowed, while still keeping ALL of the information you would need to continue the conversation with the user and remember the important context.
        
        What you emit will be sent, as-is, as the system message for the next session, so it must start with a prompt suitable to "decompress" the context and continue the conversation, including the system prompt of the original conversation so that you will know what your purpose is. Separate the first part from the second part with a separator '==chat.compressed=='.
        
        Your output will be truncated after ${token_limit} tokens, but do not sacrifice information for brevity. Since you have a token budget of ${token_limit}, use as many tokens as necessary (up to the limit) to preserve important details and context from the previous chat. You will be quizzed on details from the previous chat, so ensure that any important details are preserved so you can answer questions about what happened previously. Make the most of the token budget to retain as much information as possible while still keeping the output under ${token_limit} tokens.`,
      },
      {
        role: "user",
        content: JSON.stringify(chat_data),
      },
    ],
  };
}

export const compressChat = async (
  chat_data: ModelMessage[],
  token_limit: number = 2000,
  model: string = "gpt-4"
) => {
  const compressed = await Chat.sync(
    chatCompressionRequest(chat_data, token_limit, model)
  );
  return compressed?.content;
};

export const compressor = async (
  text_data: string,
  model: string = "gpt-4"
) => {
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
