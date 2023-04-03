import { createParser, ParsedEvent, ReconnectInterval } from "eventsource-parser";
import { Response } from "node-fetch";
import { makeApiCall, makeStreamingApiCall } from ".";
import { MessageRoles } from "../../types";
import {
  EmbeddingRequest,
  ModelCallbacks,
  ModelChatRequest,
  ModelCompletionRequest,
} from "../types";

type ChatStreamingResponse = {
  id: string;
  object: string;
  created: number;
  choices: [
    {
      message?: {
        content?: string;
        role?: MessageRoles;
      };
      delta?: {
        content?: string;
        role?: MessageRoles;
      };
      index: number;
      finish_reason: string;
    }
  ];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

type CompletionStreamingResponse = {
  id: string;
  object: string;
  created: number;
  choices: [
    {
      text: string;
      index: number;
      finish_reason: string;
    }
  ];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

const headers = () => {
  return {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    "Content-Type": "application/json",
  };
};

const streamingChatResponseHandler = (callbacks: ModelCallbacks) => {
  const parse = (event: ParsedEvent | ReconnectInterval) => {
    if (event.type === "event") {
      if ("[DONE]" == event.data) {
        return;
      }
      const data = JSON.parse(event.data) as ChatStreamingResponse;
      const delta = data.choices[0].delta;
      callbacks.onToken
        ? callbacks.onToken({
            content: delta?.content ? delta.content : undefined,
            role: delta?.role ? delta.role : undefined,
            index: data.choices[0].index,
            finish_reason: data.choices[0].finish_reason,
          })
        : null;
    }
  };

  return {
    callbacks: callbacks,
    stream: createParser(parse),
  };
};

const streamingCompletionResponseHandler = (callbacks: ModelCallbacks) => {
  const parse = (event: ParsedEvent | ReconnectInterval) => {
    if (event.type === "event") {
      if ("[DONE]" == event.data) {
        return;
      }
      const data = JSON.parse(event.data) as CompletionStreamingResponse;
      callbacks.onToken
        ? callbacks.onToken({
            content: data.choices[0].text,
            index: data.choices[0].index,
            finish_reason: data.choices[0].finish_reason,
          })
        : null;
    }
  };

  return {
    callbacks: callbacks,
    stream: createParser(parse),
  };
};

const chatData = (req: ModelChatRequest, stream: boolean) => {
  return {
    messages: req.messages,
    model: req.model,
    temperature: req.temperature,
    top_p: req.top_p,
    stream: stream,
    max_tokens: req.max_tokens,
    presence_penalty: req.presence_penalty,
    frequency_penalty: req.frequency_penalty,
    stop: req.stop,
  };
};

const completionData = (req: ModelCompletionRequest, stream: boolean) => {
  return {
    prompt: req.prompt,
    model: req.model,
    temperature: req.temperature,
    top_p: req.top_p,
    stream: stream,
    max_tokens: req.max_tokens,
    presence_penalty: req.presence_penalty,
    frequency_penalty: req.frequency_penalty,
    stop: req.stop,
  };
};

export const Chat = {
  sync: async (req: ModelChatRequest, callbacks?: ModelCallbacks) =>
    makeApiCall(
      "https://api.openai.com/v1/chat/completions",
      chatData(req, false),
      headers(),
      async (data: Response) => {
        const response = (await data.json()) as ChatStreamingResponse;
        return response.choices[0].message ? response.choices[0].message : {};
      },
      callbacks
    ),

  stream: async (req: ModelChatRequest, callbacks: ModelCallbacks) => {
    const data = chatData(req, true);
    const response = await makeStreamingApiCall(
      "https://api.openai.com/v1/chat/completions",
      data,
      headers(),
      streamingChatResponseHandler(callbacks)
    );
    return response;
  },
};

export const Complete = {
  sync: async (req: ModelCompletionRequest, callbacks?: ModelCallbacks) =>
    makeApiCall(
      "https://api.openai.com/v1/completions",
      completionData(req, false),
      headers(),
      async (data: Response) => {
        const response = (await data.json()) as CompletionStreamingResponse;
        const r = response.choices[0];
        return {
          content: r.text,
          index: r.index,
          finish_reason: r.finish_reason,
        };
      },
      callbacks
    ),

  stream: async (req: ModelCompletionRequest, callbacks: ModelCallbacks) => {
    const data = completionData(req, true);
    const response = await makeStreamingApiCall(
      "https://api.openai.com/v1/completions",
      data,
      headers(),
      streamingCompletionResponseHandler(callbacks)
    );
    return response;
  },
};

export const Embedding = {
  create: async (req: EmbeddingRequest, callbacks?: ModelCallbacks) =>
    makeApiCall("https://api.openai.com/v1/embeddings", req, headers(), async (data: Response) => {
      const response = await data.json();
      return {
        content: response.data,
      };
    }),
};
