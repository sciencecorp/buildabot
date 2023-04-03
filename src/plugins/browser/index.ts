import { Plugin } from "../base";
import { PluginManifest } from "../types";
import { BrowserAgent } from "./agent";

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

  constructor() {
    super(Browser.manifest);
  }

  async run(action: string, input: string) {
    if (action !== "browse") {
      throw new Error("Unknown action " + action);
    }

    const browserAgent = new BrowserAgent();
    await browserAgent.run(input);

    return {
      name: this.manifest.name_for_model,
      output: browserAgent.messages[-1]?.content,
    };
  }
}
