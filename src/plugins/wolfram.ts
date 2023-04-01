import fetch from "node-fetch";
import { Plugin, LoadPlugin } from "./base";

export class WolframAlpha extends Plugin {
  static manifestUrl = "https://www.wolframalpha.com/.well-known/ai-plugin.json";
  static apiUrlBase = "https://www.wolframalpha.com/api/v1/llm-api";

  static async load() {
    const manifest = await LoadPlugin(WolframAlpha.manifestUrl, true);
    if (manifest === undefined) {
      throw new Error("Failed to load plugin manifest from " + WolframAlpha.manifestUrl);
    }
    return new WolframAlpha(manifest);
  }

  async run(action: string, input: string) {
    const params = new URLSearchParams({ input: input });
    const req = await fetch(`${WolframAlpha.apiUrlBase}?${params}`, {
      method: "get",
      headers: {
        Authorization: `Bearer ${process.env.WOLFRAM_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!req.ok) {
      console.log("WolframAlpha request failed: " + req.statusText);
      console.log(req.text());
      return {
        name: this.manifest.name_for_model,
        error: "WolframAlpha request failed: " + req.statusText,
      };
    }

    const res = await req.json();
    console.log("WolframAlpha response: " + JSON.stringify(res, null, 2));

    return {
      name: this.manifest.name_for_model,
      output: "This is the output from the plugin",
    };
  }
}
