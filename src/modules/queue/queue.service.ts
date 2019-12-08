import { Redis } from 'ioredis';
import { InjectRedis } from '@sensejs/redis';
import { InjectLogger, Logger, Component } from '@sensejs/core';

@Component()
export class QueueService {
  constructor(
    @InjectLogger(QueueService) private logger: Logger,
    @InjectRedis('cacher') private readonly redis: Redis,
  ) { }

  async getQueues(): Promise<string[]> {
    const queues = await this.redis.keys('QUEUE:*');
    return queues;
  }

  async getQueue(name: string): Promise<string[]> {
    const list = await this.redis.lrange(name, 0, -1);
    return list;
  }
}
