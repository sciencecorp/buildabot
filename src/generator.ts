#!/usr/bin/env node

import fs from "fs-extra";
import path from "path";
import mkdirp from "mkdirp";
import Handlebars from "handlebars";
import chalk from "chalk";
import ora from "ora";
import boxen from "boxen";

const args = process.argv.slice(2);
const projectName = args[0] || "my-buildabot-project";

const templateDir = path.join(__dirname, "templates");
const targetDir = path.join(process.cwd(), projectName);

async function renderTemplate(
  src: string,
  dest: string,
  data: { projectName: string }
): Promise<void> {
  try {
    const templateContent = await fs.readFile(src, "utf-8");
    const template = Handlebars.compile(templateContent);
    const renderedContent = template(data);

    await fs.writeFile(dest, renderedContent);
    console.log(chalk.green(`Created: ${dest}`));
  } catch (err) {
    console.error(chalk.red(`Error creating: ${dest}\n`), err);
  }
}

async function createProject(): Promise<void> {
  const spinner = ora("Creating project...").start();

  try {
    await mkdirp(targetDir);

    const files = await fs.readdir(templateDir);
    for (const file of files) {
      await renderTemplate(path.join(templateDir, file), path.join(targetDir, file), {
        projectName,
      });
    }

    spinner.succeed(chalk.green(`Project "${projectName}" created successfully!`));

    const msgBox = boxen(
      [`To get started, run:`, ``, `  cd ${projectName}`, `  npm install`, `  npm start`].join(
        "\n"
      ),
      { padding: 1, borderColor: "green", margin: 1 }
    );

    console.log(`\n${msgBox}\n`);
  } catch (err) {
    spinner.fail(chalk.red("Error creating project:"));
    console.error(err);
  }
}

createProject();
