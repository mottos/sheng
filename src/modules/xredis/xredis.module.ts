import {Module, InjectLogger, Logger} from '@sensejs/core';
import {FilterService, ThrottleService} from './xredis.service';

export class XRedisModule extends Module({
  components: [FilterService, ThrottleService],
}) {
  constructor(@InjectLogger(XRedisModule) private logger: Logger) {
    super();
  }

  async onCreate() {
    this.logger.info('Sheng XRedisModule is Creating...');
    await super.onCreate();
    this.logger.info('Sheng XRedisModule is Created...');
  }

  async onDestroy() {
    this.logger.info('Sheng XRedisModule is Destroying...');
    await super.onDestroy();
    this.logger.info('Sheng XRedisModule is Destroyed...');
  }
}
