import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAIProvider, AIGenerateOptions, AIProviderResponse } from './ai-provider.interface';

@Injectable()
export class GeminiProvider implements IAIProvider {
  readonly name = 'gemini';
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY', '');
  }

  async generate(
    systemPrompt: string,
    userPrompt: string,
    options?: AIGenerateOptions,
  ): Promise<AIProviderResponse> {
    const startTime = Date.now();

    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const model = options?.responseFormat === 'json' ? 'gemini-1.5-flash' : 'gemini-1.5-flash';
    const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        maxOutputTokens: options?.maxTokens ?? 4096,
        temperature: options?.temperature ?? 0.7,
        responseMimeType: options?.responseFormat === 'json' ? 'application/json' : 'text/plain',
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Gemini API error ${response.status}: ${errorText}`);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json() as any;
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const tokensUsed = data.usageMetadata?.totalTokenCount ?? 0;
    const costEstimate = this.estimateCost(model, tokensUsed);

    return {
      content,
      model,
      tokensUsed,
      costEstimate,
      latencyMs: Date.now() - startTime,
    };
  }

  private estimateCost(_model: string, tokens: number): number {
    const costPer1K = 0.000075;
    return (tokens / 1000) * costPer1K;
  }
}
