import fetch from "node-fetch";
import { OpenAPIClientAxios } from "openapi-client-axios";
import { Plugin } from "./base";
import { PluginInvocation, PluginManifest } from "./types";

export class OpenApiPlugin extends Plugin {
  apiClient?: OpenAPIClientAxios;

  static async fromUrl(url: string) {
    const manifest = await OpenApiPlugin.loadPlugin(url, true);
    if (manifest === undefined) {
      throw new Error("Failed to load plugin manifest from " + url);
    }
    return new OpenApiPlugin(manifest);
  }

  static loadPlugins = async (
    manifestUrls: string[],
    strict: boolean
  ): Promise<PluginManifest[]> => {
    const reqs = await Promise.all(
      manifestUrls.map((url) => OpenApiPlugin.loadPlugin(url, strict))
    );
    return reqs.filter((req) => req !== undefined) as PluginManifest[];
  };

  static loadPlugin = async (
    manifestUrl: string,
    strict: boolean
  ): Promise<void | PluginManifest> => {
    const fetchOpenApiSpec = async (url: string) => {
      const req = await fetch(url)
        .then((res) => res.json() as Promise<PluginManifest>)
        .catch((err) => {
          if (strict) {
            throw err;
          }
          console.log("Failed to load API spec at " + url);
        });
      return req;
    };
    const req = await fetch(manifestUrl)
      .then((res) => res.json() as Promise<PluginManifest>)
      .catch((err) => {
        if (strict) {
          throw err;
        }
        console.log("Failed to load plugin at " + manifestUrl);
        console.log("Error: " + err.message);
      });
    if (req !== undefined && req.api?.url !== undefined) {
      const apiSpec = await fetchOpenApiSpec(req.api.url);
      if (apiSpec !== undefined) {
        req.api_spec = apiSpec;
      }
    }
    return req;
  };

  createAPIClient = async (): Promise<OpenAPIClientAxios> => {
    if (this.manifest.api?.url === undefined) {
      return Promise.reject("No API URL defined for plugin");
    }
    const client = new OpenAPIClientAxios({
      definition: this.manifest.api.url,
    });
    await client.init();
    return client;
  };

  async run(
    action: string,
    input: string,
    apiSpecModel?: (invoke: PluginInvocation) => Promise<PluginInvocation | undefined>
  ) {
    if (apiSpecModel) {
      console.log(`Expanding input with API spec model: ${action} ${input}`);
      const expandedInput = await apiSpecModel({
        name: this.manifest.name_for_model,
        action,
        input,
      });
      if (expandedInput === undefined) {
        return {
          name: this.manifest.name_for_model,
          error: "Failed to expand input with API spec model",
        };
      }
      action = expandedInput.action;
      input = expandedInput.input;
      console.log(`Expanded result: ${action}: ${input}`);
    }

    console.log(
      `Running plugin: name=${this.manifest.name_for_model} action=${action} input=${JSON.stringify(
        input
      )}`
    );

    try {
      if (this.apiClient === undefined) {
        this.apiClient = await this.createAPIClient();
      }

      const operation = this.apiClient.client.api.getOperations().find(
        // this is a hack, the operationId looks like `upsert_upsert_post` for some reason
        (op) => op.operationId?.includes(action)
      );

      let output = "";
      if (operation) {
        const axiosInstance = this.apiClient.client.api.getAxiosInstance();
        const axiosConfig = this.apiClient.client.api.getAxiosConfigForOperation(operation, []);
        const response = await axiosInstance.request({
          ...axiosConfig,
          baseURL: new URL(this.manifest.api?.url!).origin,
          data: JSON.parse(input),
        });
        output = JSON.stringify(response.data);
      }

      return {
        name: this.manifest.name_for_model,
        output,
      };
    } catch (err: unknown) {
      return {
        name: this.manifest.name_for_model,
        error: (err as Error).message,
      };
    }
  }
}
