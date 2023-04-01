export type ModelMessage = {
  role?: string;
  content?: string;
  index?: number;
  finish_reason?: string;
};

export type ModelManifest = {
  name: string;
};

export type ModelGenerationBase = {
  model: string;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  stop?: string | string[];
};

export type ModelCompletionRequest = ModelGenerationBase & {
  prompt: string;
};

export type ModelChatRequest = ModelGenerationBase & {
  messages: ModelMessage[];
};

export type ModelResponseBase = {
  stop_reason: string;
  stop?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type ModelCompletionResponse = ModelResponseBase & {
  completion: string;
};

export type ModelChatResponse = ModelResponseBase & {
  message: ModelMessage;
};

export type ModelResponse = ModelCompletionResponse | ModelChatResponse;

export interface ModelCallbacks {
  onStart?: () => void;
  onFinish?: () => void;
  onError?: (error: string) => void;
  onToken?: (delta: ModelMessage) => void;
  onMessage?: (message: ModelMessage) => void;
}
