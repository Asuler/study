import { Injectable, Inject } from '@nestjs/common';
import { RedisClientType } from 'redis';

@Injectable()
export class RedisService {
  @Inject('Redis_Client')
  private redicClient: RedisClientType;

  async get(key: string) {
    return this.redicClient.get(key);
  }

  async set(key: string, value: string, ttl?: number) {
    await this.redicClient.set(key, value);
    if (ttl) {
      await this.redicClient.expire(key, ttl);
    }
  }
}
