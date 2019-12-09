import { InjectLogger, Logger } from '@sensejs/core';
import { KafkaConsumerModule } from '@sensejs/kafka';
import { TypeOrmSupportInterceptor } from '@sensejs/typeorm';
import { ProducerModule } from './producer.module';
import { ConsumerService } from './consumer.service';
import { TaskModule } from '../task/task.module';
import { ConfigModule } from '../config/config.module';
import { ProcessorModule } from '../processor/processor.module';
import { TaskEventSubscriber } from './consumer.controller';

export class ConsumerModule extends KafkaConsumerModule({
  requires: [
    ConfigModule,
    TaskModule,
    ProducerModule,
    ProcessorModule,
  ],
  components: [TaskEventSubscriber, ConsumerService],
  globalInterceptors: [TypeOrmSupportInterceptor],
  injectOptionFrom: 'config.kafka.connection'
}) {
  constructor(@InjectLogger(ConsumerModule) private logger: Logger) {
    super();
  }

  async onCreate() {
    this.logger.info('Sheng ConsumerModule is Creating...');
    await super.onCreate();
    this.logger.info('Sheng ConsumerModule is Created...');
  }

  async onDestroy() {
    this.logger.info('Sheng ConsumerModule is Destroying...');
    await super.onDestroy();
    this.logger.info('Sheng ConsumerModule is Destroyed...');
  }
}
