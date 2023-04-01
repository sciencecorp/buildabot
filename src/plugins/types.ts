export type ModelPlugin = {
  manifest: PluginManifest;

  onDetect: () => void;
  onStart: () => void;
  onError: (error: string) => void;
  emitToken: (token: string) => void;
};

export type PluginInvocation = {
  plugin_name: string;
  plugin_action: string;
  action_input: string;
};

type ManifestAuthType = "none" | "user_http" | "service_http" | "oauth";
type HttpAuthorizationType = "bearer" | "basic";

type BaseManifestAuth = {
  type: ManifestAuthType;
  instructions: string;
};

type ManifestServiceHttpAuth = BaseManifestAuth & {
  type: "service_http";
  authorization_type: HttpAuthorizationType;
  verification_tokens?: {
    [service: string]: string;
  };
};

type ManifestUserHttpAuth = BaseManifestAuth & {
  type: "user_http";
  authorization_type: HttpAuthorizationType;
};

type ManifestOAuthAuth = BaseManifestAuth & {
  type: "oauth";

  // OAuth URL where a user is directed to for the OAuth authentication flow to begin.
  client_url: string;

  // OAuth scopes required to accomplish operations on the user's behalf.
  scope: string;

  // Endpoint used to exchange OAuth code with access token.
  authorization_url: string;

  // When exchanging OAuth code with access token, the expected header 'content-type'. For example: 'content-type: application/json'
  authorization_content_type: string;

  // When registering the OAuth client ID and secrets, the plugin service will surface a unique token.
  verification_tokens?: {
    [service: string]: string;
  };
};

type ManifestNoAuth = BaseManifestAuth & { type: "none" };

export type ManifestAuth =
  | ManifestNoAuth
  | ManifestServiceHttpAuth
  | ManifestUserHttpAuth
  | ManifestOAuthAuth;

export type ApiSpec = {
  type: string;
  url: string;
  is_user_authenticated: boolean;
};

export type PluginManifest = {
  schema_version: string;
  name_for_human: string;
  name_for_model: string;
  description_for_human: string;
  description_for_model: string;
  auth: ManifestAuth;
  api: ApiSpec;
  logo_url: string;
  contact_email: string;
  legal_info_url: string;
  api_spec?: any;
};
