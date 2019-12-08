import { Module, InjectLogger, Logger } from '@sensejs/core';
import { TimerService } from './timer.service';

export class TimerModule extends Module({
  requires: [],
  components: [TimerService],
}) {
  constructor(@InjectLogger(TimerModule) private logger: Logger) {
    super();
  }

  async onCreate() {
    this.logger.info('Sheng TimerModule is Creating...');
    await super.onCreate();
    this.logger.info('Sheng TimerModule is Created...');
  }

  async onDestroy() {
    this.logger.info('Sheng TimerModule is Destroying...');
    await super.onDestroy();
    this.logger.info('Sheng TimerModule is Destroyed...');
  }
}
