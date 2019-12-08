import { Redis } from 'ioredis';
import { Repository } from 'typeorm';
import { InjectRedis } from '@sensejs/redis';
import { InjectRepository } from '@sensejs/typeorm';
import { InjectLogger, Logger, Component } from '@sensejs/core';
import { Task } from './task.entity';
import { ITask } from '../../constants/task';

@Component()
export class TaskService {
  constructor(
    @InjectLogger(TaskService) private logger: Logger,
    @InjectRedis('cacher') private readonly redis: Redis,
    @InjectRepository(Task) private task: Repository<Task>,
  ) { }

  async getTask(id: string): Promise<ITask> {
    const key = `TASK:${id}`;
    const cacheData = await this.redis.get(key);
    if (cacheData) {
      const task: ITask = (cacheData && JSON.parse(cacheData));
      return task;
    }
    const task = await this.task.findOne({id});
    if (!task) {
      throw new Error('The task not exists');
    }
    this.redis.set(key, JSON.stringify(task));
    return task;
  }

  async createTask(entity: ITask): Promise<boolean> {
    const task = await this.task.save(entity);
    return !!task;
  }
}
