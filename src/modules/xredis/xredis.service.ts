import moment from 'moment';
import { Pipeline } from 'ioredis';
import { injectable } from 'inversify';
import { InjectRedis } from '@sensejs/redis';
import { ExtRedis, ExtRedisClient } from '../../commons/ext-redis';

@injectable()
export class FilterService {
  public bloomFilter: ExtRedis;
  public cuckooFilter: ExtRedis;
  constructor(
    @InjectRedis('filter') private readonly filterRedis: ExtRedis,
  ) {
    this.filterRedis = ExtRedisClient(this.filterRedis, 'filter');
    this.bloomFilter = this.filterRedis;
    this.cuckooFilter = this.filterRedis;
  }
}

@injectable()
export class ThrottleService {
  constructor(
    @InjectRedis('throttle') private readonly throttleRedis: ExtRedis,
  ) {
    this.throttleRedis = ExtRedisClient(this.throttleRedis, 'throttle');
  }

  async simpleAllowed(ident: string, action: string, period: number, maxCount: number): Promise<boolean> {
    const key = `${ident}:${action}`;
    const nowMillis: number = moment().valueOf();
    const pipeline: Pipeline = this.throttleRedis.pipeline();
    pipeline.zadd(key, nowMillis.toString(), nowMillis.toString());
    pipeline.zremrangebyscore(key, 0, Number(nowMillis) - period * 1000);
    pipeline.zcard(key);
    pipeline.expire(key, period + 1);
    const [, , count, ] = await pipeline.exec();
    return count <= maxCount;
  }

  async funnelAllowed(
    ident: string, action: string, capacity: number,
    maxCount: number, period: number
  ): Promise<boolean> {
    const key = `${ident}:${action}`;
    // tslint:disable-next-line
    const [deny, , , sleep, ] = await this.throttleRedis.clthrottle(key, capacity, maxCount, period);
    return !deny;
  }
}
