import { Module, InjectLogger, Logger } from '@sensejs/core';
import { TaskService } from './task.service';

export class TaskModule extends Module({
  requires: [],
  components: [TaskService],
}) {
  constructor(@InjectLogger(TaskModule) private logger: Logger) {
    super();
  }

  async onCreate() {
    this.logger.info('Sheng TaskModule is Creating...');
    await super.onCreate();
    this.logger.info('Sheng TaskModule is Created...');
  }

  async onDestroy() {
    this.logger.info('Sheng TaskModule is Destroying...');
    await super.onDestroy();
    this.logger.info('Sheng TaskModule is Destroyed...');
  }
}
