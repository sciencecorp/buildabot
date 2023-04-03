import { Plugin } from "./base";
import { PluginManifest } from "./types";

export class Shell extends Plugin {
  static manifest: PluginManifest = {
    schema_version: "1.0",
    name_for_human: "Shell",
    name_for_model: "Shell",
    description_for_human: "Access an interactive shell",
    description_for_model: `This plugin allows you to use an interacive shell running Ubuntu Linux. It offers one action:
- exec: [command: string]: Execute the given command in the shell and return the output
This plugin is stateful and will remember the state of the shell between invocations. You can use it repeatedly to execute multiple commands in the same shell.`,
    auth: {
      type: "none",
    },
    logo_url: "",
  };

  constructor() {
    super(Shell.manifest);
  }

  actions = {
    // TODO: implement exec
    exec: async (command: string) => "",
  };

  async run(action: string, input: string) {
    let observation;
    switch (action) {
      case "exec":
        observation = await this.actions.exec(input);
        break;
      default:
        return Promise.reject(`Unknown action: ${action}`);
    }
    return {
      name: this.manifest.name_for_model,
      output: observation,
    };
  }
}
