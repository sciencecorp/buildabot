import * as dotenv from "dotenv";
import { CliInterface } from "../src";
import makeAgent from "./makeAgent";

dotenv.config();

const run = async () => {
  const agent = await makeAgent();
  new CliInterface(agent);
};

run();
