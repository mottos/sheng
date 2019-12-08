
import config from 'config';
import { InjectLogger, Logger } from '@sensejs/core';
import { ConfigModule as DefaultConfigModule } from '@sensejs/config';

export class ConfigModule extends DefaultConfigModule({
  prefix: 'config',
  config
}) {
  constructor(@InjectLogger(ConfigModule) private logger: Logger) {
    super();
  }

  async onCreate() {
    this.logger.info('Sheng ConfigModule is Creating...');
    await super.onCreate();
    this.logger.info('Sheng ConfigModule is Created...');
  }

  async onDestroy() {
    this.logger.info('Sheng ConfigModule is Destroying...');
    await super.onDestroy();
    this.logger.info('Sheng ConfigModule is Destroyed...');
  }
}
