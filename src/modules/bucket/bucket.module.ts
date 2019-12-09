import { Module, InjectLogger, Logger } from '@sensejs/core';
import { OnceBucketService, CyclicBucketService } from './bucket.service';

export class BucketModule extends Module({
  requires: [],
  components: [OnceBucketService, CyclicBucketService],
}) {
  constructor(@InjectLogger(BucketModule) private logger: Logger) {
    super();
  }

  async onCreate() {
    this.logger.info('Sheng BucketModule is Creating...');
    await super.onCreate();
    this.logger.info('Sheng BucketModule is Created...');
  }

  async onDestroy() {
    this.logger.info('Sheng BucketModule is Destroying...');
    await super.onDestroy();
    this.logger.info('Sheng BucketModule is Destroyed...');
  }
}
