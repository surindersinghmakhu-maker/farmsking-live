import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
export declare class RedisService implements OnModuleDestroy {
    private configService;
    private readonly redis;
    private readonly logger;
    private isConnected;
    constructor(configService: ConfigService);
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttlSeconds?: number): Promise<T>;
    getClient(): Redis;
    onModuleDestroy(): void;
}
