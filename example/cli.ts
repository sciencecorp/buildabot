import { CliInterface } from "../src";
import makeAgent from "./makeAgent";
import * as dotenv from "dotenv";

dotenv.config();

const run = async () => {
  const agent = await makeAgent();
  new CliInterface(agent);
};

run();
