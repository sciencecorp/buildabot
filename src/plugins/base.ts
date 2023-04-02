import { PluginManifest, PluginOutput } from "./types";

export abstract class Plugin {
  manifest: PluginManifest;
  constructor(manifest: PluginManifest) {
    this.manifest = manifest;
  }

  metaprompt() {
    return (
      `\n### ${this.manifest.name_for_model}\n${this.manifest.description_for_model}\n` +
      (undefined !== this.manifest.api_spec
        ? `The API spec for the ${this.manifest.name_for_model} plugin is:\n\n${JSON.stringify(
            this.manifest.api_spec,
            null,
            2
          )}`
        : "")
    );
  }

  abstract run(action: string, input: string): Promise<PluginOutput>;
}
