import { InjectLogger, Logger } from '@sensejs/core';
import { TypeOrmSupportInterceptor } from '@sensejs/typeorm';
import { HttpModule as DefaultHttpModule } from '@sensejs/http';
import { BucketModule } from '../bucket/bucket.module';
import { QueueModule } from '../queue/queue.module';
import { TaskModule } from '../task/task.module';
import { RedisModule } from '../redis/redis.module';
import { TypeOrmModule } from '../typeorm/typeorm.module';
import { BucketController } from './bucket.controller';
import { QueueController } from './queue.controller';
import { TaskController } from './task.controller';
import { ConfigModule } from '../config/config.module';
import { ConsumerModule } from '../kafka/consumer.module';
import { ProducerModule } from './../kafka/producer.module';
import { TracingInterceptor } from '../../interceptors/tracing';
import { TimingInterceptor } from '../../interceptors/timing';

export class HttpModule extends DefaultHttpModule({
  requires: [
    ConfigModule,
    TypeOrmModule,
    RedisModule,
    ProducerModule,
    ConsumerModule,
    BucketModule,
    QueueModule,
    TaskModule,
  ],
  components: [
    BucketController,
    QueueController,
    TaskController,
  ],
  globalInterceptors: [
    TracingInterceptor,
    TimingInterceptor,
    TypeOrmSupportInterceptor,
  ],
  injectOptionFrom: 'config.http',
}) {
  constructor(@InjectLogger(HttpModule) private logger: Logger) {
    super();
  }

  async onCreate() {
    this.logger.info('Sheng HttpModule is Creating...');
    await super.onCreate();
    this.logger.info('Sheng HttpModule is Created...');
  }

  async onDestroy() {
    this.logger.info('Sheng HttpModule is Destroying...');
    await super.onDestroy();
    this.logger.info('Sheng HttpModule is Destroyed...');
  }
}
