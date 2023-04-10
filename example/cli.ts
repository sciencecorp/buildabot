import * as dotenv from "dotenv";
import { CliInterface } from "../src/index";
import makeAgent from "./makeAgent";

dotenv.config();

const run = async () => {
  const agent = await makeAgent();
  new CliInterface(agent);
};

run();
