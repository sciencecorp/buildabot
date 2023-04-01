import { Plugin } from "./base";
import { PluginManifest } from "./types";

export class Browser extends Plugin {
  manifest: PluginManifest = {
    schema_version: "1.0",
    name_for_human: "Browsing",
    name_for_model: "browsing",
    description_for_human: "Browsing",
    description_for_model: "Browsing",
    auth: {
      type: "none",
      instructions: "",
    },
    api: {
      type: "http",
      url: "https://www.google.com",
      is_user_authenticated: false,
    },
    logo_url: "",
    contact_email: "",
    legal_info_url: "",
  };

  actions = {
    search: {},
    open_url: {},
    click: {},
    quote: {},
    back: {},
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
