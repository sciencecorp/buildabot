import puppeteer, {
  Browser as PuppeteerBrowser,
  Page as PuppeteerPage,
} from "puppeteer";
import { ModelMessage } from "..";
import { Chat } from "../models/api/openai";
import { Plugin } from "./base";
import { PluginManifest } from "./types";
export class Browser extends Plugin {
  static manifest: PluginManifest = {
    schema_version: "1.0",
    name_for_human: "Browsing",
    name_for_model: "Browsing",
    description_for_human: "Browsing",
    description_for_model: `This plugin allows you to browse the web. To use it, you can use the following actions:
- \`browse: [prompt: string]\`: Browse the web in search of an answer to the given prompt

If the user asks you for web content that you don't know, you should not hestitate to use this plugin to retrieve it. If you would ask the user whether they would like you to check the web for the answer, you should assume YES and use this plugin to do so.`,
    auth: {
      type: "none",
    },
    logo_url: "",
  };

  browser?: PuppeteerBrowser;
  page?: PuppeteerPage;
  history: string[];
  context: ModelMessage[];

  constructor() {
    super(Browser.manifest);

    puppeteer.launch().then((browser) => {
      this.browser = browser;
      this.browser.newPage().then((page) => {
        this.page = page;
      });
    });

    this.history = [];
    this.context = [];
  }

  actions = {
    search: async (query: string) => {
      // Probably want to use SerpAPI here?
      return query;
    },
    open_url: async (url: string) => {
      await this.page?.goto(url);
      this.history.push(url);
    },
    click: async (selector: string) => {
      await this.page?.waitForSelector(selector);
      await this.page?.click(selector);
    },
    quote: async (selector: string) => {
      const textSelector = await this.page?.waitForSelector(selector);
      const text = await textSelector?.evaluate((el) => el.textContent);
      this.context.push({ content: text });
    },
    back: async (steps: string) => {
      const stepsInt = parseInt(steps);
      if (stepsInt > this.history.length) {
        throw new Error("Cannot go back " + stepsInt + " steps");
      }
      this.history = this.history.slice(0, this.history.length - stepsInt);
      await this.actions.open_url(this.history[this.history.length - 1]);
    },
  };

  async run(action: string, input: string) {
    console.log("Running plugin " + this.manifest.name_for_human);
    console.log("Action: " + action);
    console.log("Input: " + input);

    if (action !== "browse") {
      throw new Error("Unknown action " + action);
    }

    let done = false;
    while (!done) {
      await Chat.sync(
        {
          messages: [
            {
              content: `You are an assistant helping to find information on the Internet. You can request the following actions:
- \`search: [query: string]\`: Search the web for the given query
- \`open_url: [url: string]\`: Open the given URL
- \`click: [selector: string]\`: Click on the element matching the given CSS selector
- \`quote: [selector: string]\`: Quote the text of the element matching the given CSS selector
- \`back: [steps: number]\`: Go back in the browser history by the given number of steps
- \'return: [response: string]\': Stop browsing and return the given response

You are trying to find the answer to the following question:
${input}

If you are not confident that you know the answer to this question yet, try not to hallucinate. Instead, return a request to use one of the actions available to you, by simply responding `,
            },
            ...this.context,
          ],
          model: "gpt-3.5-turbo",
          max_tokens: 500,
        },
        {
          onMessage: (message: ModelMessage) => {
            if (message.content === "done") {
              done = true;
            } else {
              this.context.push(message);
            }
          },
        }
      );
    }

    return {
      name: this.manifest.name_for_model,
      output: "This is the output from the plugin",
    };
  }
}
