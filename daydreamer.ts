import { Reflector } from "./chimaera/reflector";
import { BrowserAgent } from "./src/plugins/browser/agent";

const run = async () => {
  const agent = new Reflector([]);
  agent.init();

  agent.run("What are the main limitations of Transformer architectures as a path towards AGI?");
};

run();
