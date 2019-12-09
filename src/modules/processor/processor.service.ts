import _ from 'lodash';
import moment from 'moment';
import { Redis } from 'ioredis';
import { inject } from 'inversify';
import { Repository } from 'typeorm';
import { setInterval } from 'timers';
import { InjectRedis } from '@sensejs/redis';
import { InjectRepository } from '@sensejs/typeorm';
import { InjectLogger, Logger, Component } from '@sensejs/core';
import { Task } from '../task/task.entity';
import { ITask } from '../../constants/task';
import { ProducerService } from '../kafka/producer.service';

@Component()
export class ProcessorService {
  private timer?: NodeJS.Timeout;

  constructor(
    @InjectLogger(ProcessorService) private logger: Logger,
    @InjectRedis('cacher') private readonly redis: Redis,
    @InjectRepository(Task) private task: Repository<Task>,
    @inject(ProducerService) private readonly producer: ProducerService,
  ) {
  }

  async init() {
    await this.generateBuckets();
  }

  start() {
    if (!this.timer) {
      this.timer = setInterval(() => this.run(), 30 * 1000);
    }
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async run() {
    this.logger.info(moment().format('YYYY-MM-DD HH:mm:ss'));
    // const tasks = await this.getExpireTasks();
    // const topics: {[topic: string]: string[]} = {};
    // for (const taskId of tasks) {
    //   const topic = await this.getTaskTopic(taskId);
    //   if (!topics[topic]) {
    //     topics[topic] = [];
    //   } else {
    //     topics[topic].push(taskId);
    //   }
    // }
    // _.forIn(topics, (value, key) => {
    //   this.moveTaskToQueue(value, key);
    // });
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

  async getExpireTasks(): Promise<string[]> {
    return [];
  }

  async getTaskTopic(taskId: string): Promise<string> {
    return '';
  }

  async moveTaskToQueue(taskIds: string[], topic: string): Promise<void> {
    const tx = this.redis.multi();
    tx.zrem('aaaa', ...taskIds);
    tx.lpush(topic, ...taskIds);
    await tx.exec();
  }
}
