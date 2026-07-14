import { Injectable, Logger } from '@nestjs/common';
import { IAIProvider, AIGenerateOptions, AIProviderResponse } from './providers/ai-provider.interface';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';

type ModelTier = 'cheap' | 'premium';

@Injectable()
export class AiService implements IAIProvider {
  readonly name = 'ai-service';
  private readonly logger = new Logger(AiService.name);
  private readonly providers: Record<string, IAIProvider>;

  constructor(
    private readonly geminiProvider: GeminiProvider,
    private readonly groqProvider: GroqProvider,
  ) {
    this.providers = {
      gemini: this.geminiProvider,
      groq: this.groqProvider,
    };
  }

  async generate(
    systemPrompt: string,
    userPrompt: string,
    options?: AIGenerateOptions,
  ): Promise<AIProviderResponse> {
    return this.generateWithTier('cheap', systemPrompt, userPrompt, options);
  }

  async generateWithTier(
    tier: ModelTier,
    systemPrompt: string,
    userPrompt: string,
    options?: AIGenerateOptions,
  ): Promise<AIProviderResponse> {
    const providerOrder = tier === 'premium'
      ? ['gemini', 'groq']
      : ['groq', 'gemini'];

    let lastError: Error | null = null;

    for (const providerName of providerOrder) {
      const provider = this.providers[providerName];
      try {
        this.logger.debug(`Calling ${providerName} (tier: ${tier})`);
        const result = await provider.generate(systemPrompt, userPrompt, options);
        this.logger.log(
          `AI call OK: ${providerName}/${result.model} — ${result.tokensUsed} tokens, $${result.costEstimate.toFixed(5)}, ${result.latencyMs}ms`,
        );
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Provider ${providerName} failed: ${errorMsg}`);
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    throw lastError ?? new Error('No AI providers available');
  }

  async generateJson<T>(
    tier: ModelTier,
    systemPrompt: string,
    userPrompt: string,
    options?: Omit<AIGenerateOptions, 'responseFormat'>,
  ): Promise<{ data: T; raw: AIProviderResponse }> {
    const response = await this.generateWithTier(tier, systemPrompt, userPrompt, {
      ...options,
      responseFormat: 'json',
    });

    try {
      const parsed = JSON.parse(response.content) as T;
      return { data: parsed, raw: response };
    } catch (err) {
      this.logger.error(`Failed to parse AI JSON response: ${err}`);
      throw new Error('AI returned invalid JSON');
    }
  }
}
