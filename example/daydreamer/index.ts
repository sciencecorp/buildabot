import chalk from "chalk";
import { Daydreamer, Plugin } from "../../src/plugins/index";
import { Critic } from "./critic";
import { Generator } from "./generator";

const verbose = true;

export class ChimaeraDreamer implements Daydreamer {
  generator: Generator;
  critic: Critic;

  done: boolean = false;
  counter: number = 0;
  max_iterations: number;

  constructor(plugins: Plugin[] = [], max_iterations: number = 100) {
    this.generator = new Generator(plugins);
    this.critic = new Critic(plugins);

    this.generator.init();
    this.critic.init();
    this.max_iterations = max_iterations;
  }

  async start(input: string) {
    let prompt: string | false = input;

    if (verbose) {
      console.log(chalk.bold.green("Starting daydreaming session..."));
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
          console.log(`${chalk.green("Generator")}\n${prompt}`);
        }
      } else {
        prompt = await this.critic.run(prompt);
        if (verbose) {
          console.log(`${chalk.blueBright("Critic")}\n${prompt}`);
        }
      }

      // EXTENSION FOR THE READER:
      // You should embed the new prompt and save it in a vector store here, to make the results of the daydream self-prompting available for later retrieval and use.

      counter++;

      if (counter >= this.max_iterations) {
        done = true;
      }
    }

    if (verbose) {
      console.log(chalk.bold.green("Daydreaming session complete."));
    }
  }
}
