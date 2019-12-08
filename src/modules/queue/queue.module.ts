import { Module, InjectLogger, Logger } from '@sensejs/core';
import { QueueService } from './queue.service';

export class QueueModule extends Module({
  requires: [],
  components: [QueueService],
}) {
  constructor(@InjectLogger(QueueModule) private logger: Logger) {
    super();
  }

  async onCreate() {
    this.logger.info('Sheng QueueModule is Creating...');
    await super.onCreate();
    this.logger.info('Sheng QueueModule is Created...');
  }

  async onDestroy() {
    this.logger.info('Sheng QueueModule is Destroying...');
    await super.onDestroy();
    this.logger.info('Sheng QueueModule is Destroyed...');
  }
}
