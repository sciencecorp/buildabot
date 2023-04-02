import chalk from "chalk";
import { Critic } from "./critic";
import { Generator } from "./generator";

const verbose = true;

const daydreamer = async () => {
  const generator = new Generator([]);
  const critic = new Critic([]);

  generator.init();
  critic.init();

  let prompt: string | false =
    "What are the main limitations of Transformer architectures as a path towards AGI?";

  critic.messages.push({
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
      prompt = await generator.run(prompt);
      if (verbose) {
        console.log(`${chalk.bold.green("Generator")}\n${prompt}`);
      }
    } else {
      prompt = await critic.run(prompt);
      if (verbose) {
        console.log(`${chalk.bold.blueBright("Critic")}\n${prompt}`);
      }
    }

    counter++;
  }
};

daydreamer();
