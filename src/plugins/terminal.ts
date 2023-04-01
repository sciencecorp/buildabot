import { Plugin } from "./base";
import { PluginManifest } from "./types";

export class Terminal extends Plugin {
  manifest: PluginManifest = {
    schema_version: "1.0",
    name_for_human: "Browsing",
    name_for_model: "browsing",
    description_for_human: "Browsing",
    description_for_model: "Browsing",
    auth: {
      type: "none",
    },
    logo_url: "",
  };

  actions = {
    exec: {},
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
