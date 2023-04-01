import { Plugin } from "./base";
import { PluginManifest } from "./types";

export class Browser extends Plugin {
  static manifest: PluginManifest = {
    schema_version: "1.0",
    name_for_human: "Browsing",
    name_for_model: "Browsing",
    description_for_human: "Browsing",
    description_for_model: `This plugin allows you to browse the web. To use it, you can use the following actions:
- \`search: [query: string]\`: Search the web for the given query
- \`open_url: [url: string]\`: Open the given URL
- \`click: [selector: string]\`: Click the element with the given selector
- \`quote: [selector: string]\`: Quote the text of the element with the given selector and remember it
- \`back: [steps: integer]\`: Go back in the browser history

If the user asks you for web content that you don't know, you should not hestitate to use this plugin to retrieve it. If you would ask the user whether they would like you to check the web for the answer, you should assume YES and use this plugin to do so. If you are not sure of the URL to retrieve, you can use the \`search\` action to try and figure it out.`,
    auth: {
      type: "none",
    },
    logo_url: "",
  };

  constructor() {
    super(Browser.manifest);
  }

  actions = {
    search: (query: string) => {},
    open_url: (url: string) => {},
    click: (selector: string) => {},
    quote: (selector: string) => {},
    back: (steps: number) => {},
  };

  async run(action: string, input: string) {
    console.log("Running plugin " + this.manifest.name_for_human);
    console.log("Action: " + action);
    console.log("Input: " + input);

    return {
      name: this.manifest.name_for_model,
      output: "This is the output from the plugin",
    };
  }
}
