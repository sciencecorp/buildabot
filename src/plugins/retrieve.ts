import { Plugin } from "./base";
import { PluginManifest } from "./types";

export class Retrieve extends Plugin {
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
