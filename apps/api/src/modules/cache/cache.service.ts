import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis: Redis | null = null;
  private readonly fallback = new Map<string, { data: string; expiry: number }>();
  private readonly DEFAULT_TTL = 300;

  constructor() {
    if (process.env.REDIS_URL) {
      try {
        this.redis = new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => Math.min(times * 50, 2000),
          lazyConnect: true,
        });
        this.redis.connect().catch(() => {
          this.logger.warn('Redis connection failed — using in-memory fallback cache');
        });
      } catch {
        this.logger.warn('Redis not available — using in-memory fallback cache');
      }
    } else {
      this.logger.log('No REDIS_URL configured — using in-memory fallback cache');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.redis) {
      try {
        const raw = await this.redis.get(key);
        if (raw) return JSON.parse(raw) as T;
      } catch {
        /* fall through to memory */
      }
    }
    const mem = this.fallback.get(key);
    if (mem && Date.now() < mem.expiry) {
      return JSON.parse(mem.data) as T;
    }
    if (mem) this.fallback.delete(key);
    return null;
  }

  async set(key: string, value: unknown, ttlSeconds = this.DEFAULT_TTL): Promise<void> {
    const data = JSON.stringify(value);
    if (this.redis) {
      try {
        await this.redis.setex(key, ttlSeconds, data);
        return;
      } catch {
        /* fall through to memory */
      }
    }
    this.fallback.set(key, { data, expiry: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.del(key);
      } catch { /* ignore */ }
    }
    this.fallback.delete(key);
  }

  async purge(pattern: string): Promise<void> {
    if (this.redis) {
      try {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) await this.redis.del(...keys);
      } catch { /* ignore */ }
    }
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const key of this.fallback.keys()) {
      if (regex.test(key)) this.fallback.delete(key);
    }
  }
}
