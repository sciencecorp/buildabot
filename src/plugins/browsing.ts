import { ModelPlugin, PluginManifest } from "./types";

export class Browser implements ModelPlugin {
  manifest: PluginManifest = {
    schema_version: "1.0",
    name_for_human: "Browsing",
    name_for_model: "browsing",
    description_for_human: "Browsing",
    description_for_model: "Browsing",
    auth: {
      type: "none",
      instructions: "",
    },
    api: {
      type: "http",
      url: "https://www.google.com",
      is_user_authenticated: false,
    },
    logo_url: "",
    contact_email: "",
    legal_info_url: "",
  };

  onDetect = () => {
    console.log("Browsing detected");
  };
  onStart = () => {
    console.log("Browsing started");
  };
  onError = (error: string) => {
    console.log("Browsing error: " + error);
  };
  emitToken = (token: string) => {
    console.log("Browsing token: " + token);
  };
}
