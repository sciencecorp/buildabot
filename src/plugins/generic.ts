import { LoadPlugin, Plugin } from "./base";

export class GenericPlugin extends Plugin {
  static async fromUrl(url: string) {
    const manifest = await LoadPlugin(url, true);
    if (manifest === undefined) {
      throw new Error("Failed to load plugin manifest from " + url);
    }
    return new GenericPlugin(manifest);
  }

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
