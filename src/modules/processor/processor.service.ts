import _ from 'lodash';
import moment from 'moment';
import { Redis } from 'ioredis';
import { Repository } from 'typeorm';
import { InjectRedis } from '@sensejs/redis';
import { InjectRepository } from '@sensejs/typeorm';
import { InjectLogger, Logger, Component } from '@sensejs/core';
import { Task } from '../task/task.entity';
import { ITask } from '../../constants/task';

@Component()
export class ProcessorService {
  constructor(
    @InjectLogger(ProcessorService) private logger: Logger,
    @InjectRedis('cacher') private readonly redis: Redis,
    @InjectRepository(Task) private task: Repository<Task>,
  ) {
  }

  async generateBuckets(): Promise<void> {
    const timeStamp = moment().unix();
    const defaultScore = _.add(timeStamp, _.subtract(10, timeStamp % 10));
    this.logger.log('ProcessorService -> generateBuckets -> startTime: ', moment().format('YYYY-MM-DD HH:mm:ss'));
    const tasks: ITask[] = await this.task.find();
    _.forEach(tasks, async (task) => {
      const {type, delay} = task;
      await this.redis.zadd(`BUCKET:${type}`, String(defaultScore + delay), JSON.stringify(task));
    });
    this.logger.log('ProcessorService -> generateBuckets -> endTime: ', moment().format('YYYY-MM-DD HH:mm:ss'));
  }
}
