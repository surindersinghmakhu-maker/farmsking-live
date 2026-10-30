"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
let RedisService = RedisService_1 = class RedisService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(RedisService_1.name);
        this.isConnected = false;
        const redisUrl = this.configService.get('REDIS_URL');
        if (redisUrl) {
            this.redis = new ioredis_1.default(redisUrl, {
                maxRetriesPerRequest: 3,
                retryStrategy(times) {
                    if (times > 5) {
                        return null;
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
        }
        else {
            this.logger.warn('REDIS_URL is not set. Caching will be disabled.');
            this.redis = new ioredis_1.default({ lazyConnect: true });
        }
    }
    async get(key) {
        if (!this.isConnected)
            return null;
        try {
            const data = await this.redis.get(key);
            if (!data)
                return null;
            return JSON.parse(data);
        }
        catch (e) {
            this.logger.error(`Error getting cache key ${key}: ${e}`);
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        if (!this.isConnected)
            return;
        try {
            const stringValue = JSON.stringify(value);
            if (ttlSeconds) {
                await this.redis.set(key, stringValue, 'EX', ttlSeconds);
            }
            else {
                await this.redis.set(key, stringValue);
            }
        }
        catch (e) {
            this.logger.error(`Error setting cache key ${key}: ${e}`);
        }
    }
    async del(key) {
        if (!this.isConnected)
            return;
        try {
            await this.redis.del(key);
        }
        catch (e) {
            this.logger.error(`Error deleting cache key ${key}: ${e}`);
        }
    }
    async getOrSet(key, fetchFn, ttlSeconds = 300) {
        if (!this.isConnected)
            return fetchFn();
        const cached = await this.get(key);
        if (cached !== null) {
            return cached;
        }
        const freshData = await fetchFn();
        await this.set(key, freshData, ttlSeconds);
        return freshData;
    }
    getClient() {
        return this.redis;
    }
    onModuleDestroy() {
        if (this.redis) {
            this.redis.disconnect();
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map