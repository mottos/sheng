import { Module, InjectLogger, Logger } from '@sensejs/core';
import { ProcessorService } from './processor.service';
import { ConfigModule } from '../config/config.module';

export class ProcessorModule extends Module({
  requires: [ConfigModule],
  components: [ProcessorService],
}) {
  constructor(@InjectLogger(ProcessorModule) private logger: Logger) {
    super();
  }

  async onCreate() {
    this.logger.info('Sheng ProcessorModule is Creating...');
    await super.onCreate();
    this.logger.info('Sheng ProcessorModule is Created...');
  }

  async onDestroy() {
    this.logger.info('Sheng ProcessorModule is Destroying...');
    await super.onDestroy();
    this.logger.info('Sheng ProcessorModule is Destroyed...');
  }
}
