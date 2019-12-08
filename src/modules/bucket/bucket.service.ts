import { Redis } from 'ioredis';
import { InjectRedis } from '@sensejs/redis';
import { $enum, EnumValueMapper } from 'ts-enum-util';
import { InjectLogger, Logger, Component } from '@sensejs/core';
import { BucketType } from '../../constants/bucket';

export interface IBucket {
  readonly logger: Logger;
  readonly redis: Redis;

  // 获取bucket列表
  getBuckets(): EnumValueMapper<BucketType, string[]>;
  // 获取typeBucket
  getTypeBucket(type: BucketType): string[];
}

export abstract class BucketService {
  constructor(
    @InjectLogger(BucketService) private logger: Logger,
    @InjectRedis('cacher') readonly redis: Redis,
  ) { }

  async getBuckets(): Promise<string[]> {
    const buckets = await this.redis.keys('BUCKET:*');
    return buckets;
  }

  async abstract getBucket(): Promise<string[]>;
}

@Component()
export class OnceBucketService extends BucketService {

  async getBucket(): Promise<string[]> {
    const type = BucketType.once;
    const bucket = await this.redis.zrange(`BUCKET:${type.toUpperCase()}`, 0, -1);
    return bucket;
  }
}

@Component()
export class CyclicBucketService extends BucketService {

  async getBucket(): Promise<string[]> {
    const type = BucketType.cyclic;
    const bucket = await this.redis.zrange(`BUCKET:${type.toUpperCase()}`, 0, -1);
    return bucket;
  }
}
