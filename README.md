# build-a-bot

A production-grade framework for building AI agents.

## Basic Architecture

Build-a-bot is oriented around four basic components:

- One or more _models_, which make API calls out to LLMs. (Or some other model.) Models never run within a bot; they are always called over then network.
- Zero or more _plugins_, which can be used by agents to access external tools and resources.
- One or more _agents_, which compose models, prompts and plugins into meaningful behavior.
- One or more _interfaces_, which expose functionality of your agent(s) to users, such as via a websocket, Slack bot, over email or so on.

A typical implementation will expose one agent built on a range of models and prompts and able to use a range of plugins via a websocket.

## Known Issues

- Observations in the Browser plugin are frequently far too large to fit in model context, and splitting is not currently implemented.
- The Shell plugin is currently a stub.

## Todo

- handle plugin use in streaming agents
- smart prompt compiler to stay within context window and generally minimize token use
  - implement agent scratchpad & self-prompting (chain of thought)
- add tests
