import { EventSourceParser } from "eventsource-parser";
import fetch, { RequestInfo, RequestInit } from "node-fetch";
import { createInterface as readlines } from "readline";
import { ModelCallbacks, ModelMessage } from "../types";

export async function* fetchEventSource(
  url: RequestInfo,
  init?: RequestInit
): AsyncGenerator<string, void, unknown> {
  const res = await fetch(url, init);
  if (!res.ok) throw res;

  for await (const line of readlines(res.body)) {
    const [event, content] = line.split(": ", 2);
    if (event === "data") {
      yield content;
    }
  }
}

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
        console.error(res.status);
        console.error(res.statusText);
        console.error(res.text);
        console.log("Data: " + JSON.stringify(data));
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
  try {
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
  } catch (err) {
    callbacks?.onError ? callbacks.onError((err as Error).message) : null;
    callbacks?.onFinish ? callbacks.onFinish() : null;
  }
};
