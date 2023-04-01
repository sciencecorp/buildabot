import fetch from "node-fetch";
import { ModelCallbacks, ModelMessage } from "../types";
import { EventSourceParser } from "eventsource-parser";

export const makeStreamingApiCall = async (
  endpoint: string,
  data: any,
  headers: any,
  handler: {
    stream: EventSourceParser;
    callbacks?: ModelCallbacks;
  }
) => {
  const { stream, callbacks } = handler;
  await fetch(endpoint, {
    method: "post",
    body: JSON.stringify(data),
    headers: headers,
  })
    .then(async (res) => {
      if (!res.ok) {
        throw res;
      }
      callbacks?.onStart ? callbacks.onStart() : null;
      for await (const chunk of res.body) {
        stream.feed(chunk.toString());
      }
      callbacks?.onFinish ? callbacks.onFinish() : null;
    })
    .catch((err) => {
      callbacks?.onError ? callbacks.onError(err) : null;
    });
};

export const makeApiCall = async (
  endpoint: string,
  data: any,
  headers: any,
  messageParser: (data: any) => Promise<ModelMessage>,
  callbacks?: ModelCallbacks
) => {
  callbacks?.onStart ? callbacks.onStart() : null;
  const req = await fetch(endpoint, {
    method: "post",
    body: JSON.stringify(data),
    headers: headers,
  });
  if (!req.ok) {
    callbacks?.onError ? callbacks?.onError(await req.text()) : null;
  }
  const msg = await messageParser(req);
  callbacks?.onMessage ? callbacks.onMessage(msg) : null;
  callbacks?.onFinish ? callbacks.onFinish() : null;
  return msg;
};
