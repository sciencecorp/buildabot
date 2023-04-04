import { Plugin } from "../src";
import { Browser, Daydream, Shell } from "../src/plugins";
import { OpenApiPlugin } from "../src/plugins/openapi";
import { ChimaeraAgent } from "./agent";
import { ChimaeraDreamer } from "./daydreamer";

export default async function makeAgent() {
  const retrievalPlugin = process.env.RETRIEVAL_PLUGIN_URL
    ? [await OpenApiPlugin.fromUrl(process.env.RETRIEVAL_PLUGIN_URL)]
    : [];

  const plugins: Plugin[] = [
    new Browser(),
    new Shell(),
    new Daydream(new ChimaeraDreamer(retrievalPlugin)),
    ...retrievalPlugin,
  ];

  const agent = new ChimaeraAgent(plugins);
  agent.init();

  return agent;
}
