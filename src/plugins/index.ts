import fetch from "node-fetch";
import { PluginManifest } from "./types";

export { Browser } from "./browsing";
export { ModelPlugin } from "./types";

export class Plugin {
  manifest: PluginManifest;
  constructor(manifest: PluginManifest) {
    this.manifest = manifest;
  }

  static async fromUrl(url: string) {
    const manifest = await LoadPlugin(url, true);
    if (manifest === undefined) {
      throw new Error("Failed to load plugin manifest from " + url);
    }
    return new Plugin(manifest);
  }

  metaprompt() {
    let prompt = "\n* " + this.manifest.name_for_model + "\n";

    prompt += this.manifest.description_for_model + "\n";

    if (this.manifest.api_spec !== undefined) {
      prompt += `The API spec for the ${
        this.manifest.name_for_model
      } plugin is:\n\n${JSON.stringify(this.manifest.api_spec, null, 2)}`;
    }

    return prompt;
  }

  async run(action: string, input: string) {
    console.log("Running plugin " + this.manifest.name_for_human);
    console.log("Action: " + action);
    console.log("Input: " + input);
  }
}

export const LoadPlugins = async (
  manifestUrls: string[],
  strict: boolean
): Promise<PluginManifest[]> => {
  const reqs = await Promise.all(manifestUrls.map((url) => LoadPlugin(url, strict)));
  return reqs.filter((req) => req !== undefined) as PluginManifest[];
};

export const LoadPlugin = async (
  manifestUrl: string,
  strict: boolean
): Promise<void | PluginManifest> => {
  const fetchOpenApiSpec = async (url: string) => {
    const req = await fetch(url)
      .then((res) => res.json() as Promise<PluginManifest>)
      .catch((err) => {
        if (strict) {
          throw err;
        }
        console.log("Failed to load API spec at " + url);
      });
    return req;
  };
  const req = await fetch(manifestUrl)
    .then((res) => res.json() as Promise<PluginManifest>)
    .catch((err) => {
      if (strict) {
        throw err;
      }
      console.log("Failed to load plugin at " + manifestUrl);
      console.log("Error: " + err.message);
    });
  if (req !== undefined && req.api.url !== undefined) {
    const apiSpec = await fetchOpenApiSpec(req.api.url);
    if (apiSpec !== undefined) {
      req.api_spec = apiSpec;
    }
  }
  return req;
};
