import { Plugin } from "./base";
import { PluginManifest } from "./types";

export interface Daydreamer {
  start(prompt: string): Promise<any>;
}

export class Daydream extends Plugin {
  static manifest: PluginManifest = {
    schema_version: "1.0",
    name_for_human: "Daydream",
    name_for_model: "Daydream",
    description_for_human: "Self-reflect on a prompt in the background",
    description_for_model: `When you have an especially interesting idea or encounter a difficult question you want to think more about, you can use the \`daydream\` action to mull it over further in the background:
- \`start: [prompt: string]\`: Daydream about the given prompt

You won't be directly aware of the results of your daydreaming, but you will be able to use the results of your daydreaming in your responses to the user since they will be added to your long-term memory database.`,
    auth: {
      type: "none",
    },
    logo_url: "",
  };

  daydreamer: Daydreamer;

  constructor(daydreamer: Daydreamer) {
    super(Daydream.manifest);
    this.daydreamer = daydreamer;
  }

  async run(action: string, input: string) {
    this.daydreamer.start(input);
    return {
      name: this.manifest.name_for_model,
      output: `Began daydreaming about ${input}...`,
    };
  }
}
