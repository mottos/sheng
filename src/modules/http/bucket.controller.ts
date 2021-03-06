import _ from 'lodash';
import { inject } from 'inversify';
import { Controller, GET } from '@sensejs/http';
import { InjectLogger, Logger } from '@sensejs/core';
import { OnceBucketService, CyclicBucketService } from '../bucket/bucket.service';

@Controller('/api/buckets')
export class BucketController {
  constructor(
    @InjectLogger(BucketController) private logger: Logger,
    @inject(OnceBucketService) private readonly onceBucketService: OnceBucketService,
    @inject(CyclicBucketService) private readonly cyclicBucketService: CyclicBucketService,
  ) {
  }

  @GET('/')
  async buckets(): Promise<string[]> {
    this.logger.info('Get buckets starting.');
    const buckets = await this.onceBucketService.getBuckets();
    return buckets;
  }

  @GET('/once')
  async onceBucket(): Promise<string[]> {
    this.logger.info('Get buckets starting.');
    const bucket = await this.onceBucketService.getBucket();
    return bucket;
  }

  @GET('/cyclic')
  async cyclicBucket(): Promise<string[]> {
    this.logger.info('Get buckets starting.');
    const bucket = await this.cyclicBucketService.getBucket();
    return bucket;
  }
}
