import _ from 'lodash';
import { Redis } from 'ioredis';
import { inject } from 'inversify';
import { InjectRedis } from '@sensejs/redis';
import { InjectLogger, Logger, Component } from '@sensejs/core';
import { ITask } from '../../constants/task';
import { TaskService } from '../task/task.service';
import { ConsumerTopicNames } from '../../constants/kafka';

@Component()
export class ConsumerService {
  constructor(
    @InjectLogger(ConsumerService) private readonly logger: Logger,
    @InjectRedis('locker') private readonly lockRedis: Redis,
    @InjectRedis('cacher') private readonly cacheRedis: Redis,
    @inject(TaskService) private readonly taskService: TaskService,
  ) {
  }

  async applyLock(lockKey: string): Promise<boolean> {
    const flag = await this.lockRedis.set(lockKey, 1, 'ex', 60, 'nx');
    return !!flag;
  }

  async clearLock(lockKey: string): Promise<any> {
    const flag = await this.lockRedis.del(lockKey);
    return !!flag;
  }

  async taskHandler(topic: string, task: ITask): Promise<boolean> {
    let result: boolean = false;
    switch (topic) {
      case ConsumerTopicNames.delayQueue:
        this.logger.info(`[upstreamMsg] get original message: ${JSON.stringify(task)}`);
        result = await this.taskService.createTask(task);
        break;
      default:
        this.logger.error(`[merchantHandler] topic ${topic} no support`);
        break;
    }
    return result;
  }
}
