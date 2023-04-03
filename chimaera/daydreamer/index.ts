import chalk from "chalk";
import { Critic } from "./critic";
import { Generator } from "./generator";
import { Daydreamer } from "../../src/plugins";

const verbose = true;

export class ChimaeraDreamer implements Daydreamer {
  generator = new Generator([]);
  critic = new Critic([]);

  constructor() {
    this.generator.init();
    this.critic.init();
  }

  async start(input: string) {
    let prompt: string | false = input;

    if (verbose) {
      console.log("Starting daydreaming session...");
      console.log(`Prompt: ${chalk.bold(prompt)}`);
    }

    this.critic.messages.push({
      role: "user",
      content: prompt,
    });

    let done = false;
    let counter = 0;
    while (!done) {
      if (!prompt) {
        console.log("Warning: received a blank prompt.");
        continue;
      }

      if (counter % 2 === 0) {
        prompt = await this.generator.run(prompt);
        if (verbose) {
          console.log(`${chalk.bold.green("Generator")}\n${prompt}`);
        }
      } else {
        prompt = await this.critic.run(prompt);
        if (verbose) {
          console.log(`${chalk.bold.blueBright("Critic")}\n${prompt}`);
        }
      }

      counter++;
    }
  }
}
