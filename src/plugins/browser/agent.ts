import puppeteer, { Browser as PuppeteerBrowser, Page as PuppeteerPage } from "puppeteer";
import { getJson } from "serpapi";
import { Agent, PluginInvocation } from "../..";
import { Chat } from "../../models/api/openai";
import { PluginOutput } from "../types";

export class BrowserAgent extends Agent {
  basePrompt =
    () => `You are an artificial intelligence program to find information on the Internet. You can take the following actions to fulfill your purpose:
- \`search: [query: string]\`: Search the web for the given query
- \`navigate: [url: string]\`: Navigate to the given URL and read the page contents
- \`quote: [selector: string]\`: Quote the text of the element matching the given CSS selector
- \`back: [steps: number]\`: Go back in the browser history by the given number of steps
- \'return: [response: string]\`: Stop browsing and return the given response

To use one of these actions, simply print the action name followed by a colon and the action input. Here are several examples of completions you might produce:

search: what is the meaning of life?
open_url: https://en.wikipedia.org/wiki/Meaning_of_life
quote: #mw-content-text > div.mw-parser-output > p:nth-child(1)
back: 1

You should return ONLY these string completions and do not inlcude any other text in your response. When you are done browsing, you should return the string "return" followed by any text you found responsive to the original prompt. For example:

user: What are the top 3 links on the front page of Hacker News?
agent: open_url: https://news.ycombinator.com/
agent: return: [{title: "Ask HN: What are you working on?", url: "https://news.ycombinator.com/item?id=27400038"},{title: "XUL Layout has been removed from Firefox (crisal.io)", url: "https://crisal.io/words/2023/03/30/xul-layout-is-gone.html"},{title: "The 2021 State of CSS Survey (stateofcss.com)", url: "https://2021.stateofcss.com/en-US/"}]`;

  browser?: PuppeteerBrowser;
  page?: PuppeteerPage;
  history: string[];
  verbose: boolean = false;

  constructor() {
    super([]);
    puppeteer.launch().then((browser) => {
      this.browser = browser;
      this.browser.newPage().then((page) => {
        this.page = page;
      });
    });

    this.history = [];
  }

  handlePluginOutput = (input: PluginInvocation, output: PluginOutput) => {};
  detectPluginUse = (response: string): false | PluginInvocation => false;

  actions = {
    search: async (query: string) => {
      return JSON.stringify(
        (
          await getJson("google", {
            api_key: process.env.SERPAPI_API_KEY,
            q: query,
          })
        ).organic_results.map((result: any) => ({
          position: result.position,
          title: result.title,
          url: result.link,
        }))
      );
    },
    open_url: async (url: string) => {
      await this.page?.goto(url);
      this.history.push(url);
      return await this.page?.content();
    },
    click: async (selector: string) => {
      await this.page?.waitForSelector(selector);
      await this.page?.click(selector);
      return "Clicked OK";
    },
    quote: async (selector: string) => {
      const textSelector = await this.page?.waitForSelector(selector);
      return await textSelector?.evaluate((el) => el.textContent);
    },
    back: async (steps: string) => {
      const stepsInt = parseInt(steps);
      if (stepsInt > this.history.length) {
        throw new Error(`Cannot go back ${stepsInt} steps`);
      }
      this.history = this.history.slice(0, this.history.length - stepsInt);
      return await this.actions.open_url(this.history[this.history.length - 1]);
    },
  };

  async run(prompt?: string) {
    if (prompt) {
      this.messages.push({
        role: "user",
        content: prompt,
      });
    }
    let done = false;
    while (!done) {
      const message = await Chat.sync(
        {
          messages: this.messages,
          model: "gpt-3.5-turbo",
          max_tokens: 500,
        },
        {
          onError: (error) => {
            console.log("Error: " + error);
            done = true;
          },
        }
      );

      if (!message || !message.content) {
        console.log("Warning: received a null or blank completion from BrowserAgent");
        return;
      }

      if (this.verbose) {
        console.log("BrowserAgent: " + message.content);
      }

      this.messages.push(message);

      const match = /(\w+): (.*)/.exec(message.content);

      if (!match) {
        console.log(
          `Warning: received an invalid completion from BrowserAgent: ${message.content}`
        );
        return;
      }

      const [_, action, input] = match;

      let response: undefined | string = "";
      if (action in this.actions) {
        switch (action) {
          case "return":
            done = true;
            break;
          case "back":
            response = await this.actions[action](input);
            break;
          case "open_url":
            response = await this.actions[action](input);
            break;
          case "click":
            response = await this.actions[action](input);
            break;
          case "quote":
            response = await this.actions[action](input);
            break;
          case "search":
            response = await this.actions[action](input);
            break;
          default:
            console.log(`Warning: received an invalid action '${action}' from BrowserAgent`);
        }
      }

      if (this.verbose) {
        console.log("BrowserAgent: " + response);
      }

      this.messages.push({
        role: "system",
        content: response,
      });
    }
  }
}
