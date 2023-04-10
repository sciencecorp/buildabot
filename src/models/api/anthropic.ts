import { createParser, ParsedEvent, ReconnectInterval } from "eventsource-parser";
import { Response } from "node-fetch";
import { makeApiCall, makeStreamingApiCall } from "./index";
import { ModelCallbacks, ModelCompletionRequest } from "../types";

const headers = () => {
  return {
    "X-API-Key": `${process.env.ANTHROPIC_API_KEY}`,
    "Content-Type": "application/json",
  };
};

export type CompletionResponse = {
  completion: string;
  stop: string | null;
  stop_reason: "stop_sequence" | "max_tokens";
  truncated: boolean;
  exception: string | null;
  log_id: string;
};

const streamingCompletionResponseHandler = (callbacks: ModelCallbacks) => {
  const parse = (event: ParsedEvent | ReconnectInterval) => {
    if (event.type === "event") {
      if ("[DONE]" == event.data) {
        return;
      }
      const data = JSON.parse(event.data) as CompletionResponse;
      callbacks.onToken
        ? callbacks.onToken({
            content: data.completion,
            finish_reason: data.stop ? data.stop_reason : undefined,
          })
        : null;
    }
  };

  return {
    callbacks: callbacks,
    stream: createParser(parse),
  };
};

const completionData = (req: ModelCompletionRequest, stream: boolean) => {
  return {
    prompt: req.prompt,
    model: req.model,
    temperature: req.temperature,
    max_tokens_to_sample: req.max_tokens,
    stop_sequences: req.stop,
    top_p: req.top_p,
    stream: stream,
  };
};

export const Complete = {
  sync: async (req: ModelCompletionRequest, callbacks: ModelCallbacks) =>
    makeApiCall(
      "https://api.anthropic.com/v1/complete",
      completionData(req, false),
      headers(),
      async (data: Response) => {
        const response = (await data.json()) as CompletionResponse;
        return {
          content: response.completion,
        };
      },
      callbacks
    ),

  stream: async (req: ModelCompletionRequest, callbacks: ModelCallbacks) => {
    const data = completionData(req, true);
    const response = await makeStreamingApiCall(
      "https://api.anthropic.com/v1/complete",
      data,
      headers(),
      streamingCompletionResponseHandler(callbacks)
    );
    return response;
  },
};
