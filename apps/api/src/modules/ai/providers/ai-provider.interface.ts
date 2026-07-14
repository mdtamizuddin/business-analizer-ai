export interface IAIProvider {
  readonly name: string;

  generate(
    systemPrompt: string,
    userPrompt: string,
    options?: AIGenerateOptions,
  ): Promise<AIProviderResponse>;
}

export interface AIGenerateOptions {
  maxTokens?: number;
  temperature?: number;
  responseFormat?: 'text' | 'json';
}

export interface AIProviderResponse {
  content: string;
  model: string;
  tokensUsed: number;
  costEstimate: number;
  latencyMs: number;
}
