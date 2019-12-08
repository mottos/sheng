import _ from 'lodash';
import uuid from 'uuid/v4';
import { inject } from 'inversify';
import { InjectLogger, Logger } from '@sensejs/core';
import { Controller, GET, Body, Path, POST } from '@sensejs/http';
import { TaskService } from '../task/task.service';
import { ITask } from '../../constants/task';

@Controller('/api/tasks')
export class TaskController {
  constructor(
    @InjectLogger(TaskController) private logger: Logger,
    @inject(TaskService) private readonly taskService: TaskService,
  ) {
  }

  @GET('/:id')
  async getTask(@Path('name') id: string): Promise<ITask> {
    this.logger.info('GetTask starting.');
    const task = await this.taskService.getTask(id);
    return task;
  }

  @POST('/')
  async createTask(@Body() task: ITask): Promise<boolean> {
    this.logger.info('CreateTask starting.');
    task.id = uuid();
    const result = await this.taskService.createTask(task);
    return result;
  }
}
