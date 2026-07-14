import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAIProvider, AIGenerateOptions, AIProviderResponse } from './ai-provider.interface';

@Injectable()
export class GroqProvider implements IAIProvider {
  readonly name = 'groq';
  private readonly logger = new Logger(GroqProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GROQ_API_KEY', '');
  }

  async generate(
    systemPrompt: string,
    userPrompt: string,
    options?: AIGenerateOptions,
  ): Promise<AIProviderResponse> {
    const startTime = Date.now();

    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    const model = 'llama-3.3-70b-versatile';

    const body = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature ?? 0.7,
      response_format: options?.responseFormat === 'json' ? { type: 'json_object' } : undefined,
    };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Groq API error ${response.status}: ${errorText}`);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content ?? '';
    const tokensUsed = (data.usage?.prompt_tokens ?? 0) + (data.usage?.completion_tokens ?? 0);
    const costEstimate = this.estimateCost(tokensUsed);

    return {
      content,
      model,
      tokensUsed,
      costEstimate,
      latencyMs: Date.now() - startTime,
    };
  }

  private estimateCost(tokens: number): number {
    // Groq is currently free tier — estimate at minimal cost
    return (tokens / 1000) * 0.0001;
  }
}
