import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly logger = new Logger(RedisService.name);
  private isConnected = false;

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    
    if (redisUrl) {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 5) {
            return null; // Stop retrying after 5 attempts
          }
          return Math.min(times * 100, 3000);
        },
      });

      this.redis.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Successfully connected to Redis');
      });

      this.redis.on('error', (err) => {
        this.isConnected = false;
        this.logger.warn(`Redis connection error: ${err.message}`);
      });
    } else {
      this.logger.warn('REDIS_URL is not set. Caching will be disabled.');
      // Create a dummy client that fails gracefully or does nothing
      this.redis = new Redis({ lazyConnect: true });
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) return null;
    try {
      const data = await this.redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (e) {
      this.logger.error(`Error getting cache key ${key}: ${e}`);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.isConnected) return;
    try {
      const stringValue = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis.set(key, stringValue, 'EX', ttlSeconds);
      } else {
        await this.redis.set(key, stringValue);
      }
    } catch (e) {
      this.logger.error(`Error setting cache key ${key}: ${e}`);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected) return;
    try {
      await this.redis.del(key);
    } catch (e) {
      this.logger.error(`Error deleting cache key ${key}: ${e}`);
    }
  }
  
  async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttlSeconds = 300): Promise<T> {
    if (!this.isConnected) return fetchFn();
    
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    const freshData = await fetchFn();
    await this.set(key, freshData, ttlSeconds);
    return freshData;
  }

  getClient(): Redis {
    return this.redis;
  }

  onModuleDestroy() {
    if (this.redis) {
      this.redis.disconnect();
    }
  }
}
