import { KafkaProducerModule } from '@sensejs/kafka';
import { InjectLogger, Logger } from '@sensejs/core';
import { ProducerService } from './producer.service';
import { ConfigModule } from '../config/config.module';

export class ProducerModule extends KafkaProducerModule({
  requires: [ConfigModule],
  components: [ProducerService],
  injectOptionFrom: 'config.kafka.connection'
}) {
  constructor(@InjectLogger(ProducerModule) private logger: Logger) {
    super();
  }

  async onCreate() {
    this.logger.info('Sheng ProducerModule is Creating...');
    await super.onCreate();
    this.logger.info('Sheng ProducerModule is Created...');
  }

  async onDestroy() {
    this.logger.info('Sheng ProducerModule is Destroying...');
    await super.onDestroy();
    this.logger.info('Sheng ProducerModule is Destroyed...');
  }
}
