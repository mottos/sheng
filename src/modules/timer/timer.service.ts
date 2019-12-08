import { Redis } from 'ioredis';
import { InjectRedis } from '@sensejs/redis';
import { InjectLogger, Logger, Component } from '@sensejs/core';

@Component()
export class TimerService {
  constructor(
    @InjectLogger(TimerService) private logger: Logger,
    @InjectRedis('cacher') private readonly redis: Redis,
  ) { }

  async getTimers(): Promise<string[]> {
    const queues = await this.redis.keys('QUEUE:*');
    return queues;
  }

  async getTimer(name: string): Promise<string[]> {
    const list = await this.redis.lrange(name, 0, -1);
    return list;
  }
}
