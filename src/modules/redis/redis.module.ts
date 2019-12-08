import { RedisModule as DefaultRedisModule } from '@sensejs/redis';
import { InjectLogger, Logger } from '@sensejs/core';
import { ConfigModule } from '../config/config.module';

export class RedisModule extends DefaultRedisModule([{
  name: 'locker',
  options: {port: 6379, host: 'localhost', db: 0},
  // requires: [ConfigModule],
  // injectOptionFrom: 'config.redis.lock',
}, {
  name: 'cacher',
  options: {port: 6379, host: 'localhost', db: 1},
  requires: [ConfigModule],
  // injectOptionFrom: 'config.redis.cache',
}, {
  name: 'expirer',
  options: {port: 6379, host: 'localhost', db: 2},
  // requires: [ConfigModule],
  // injectOptionFrom: 'config.redis.expire',
}, {
  name: 'filter',
  options: {port: 6379, host: 'localhost', db: 3},
  // requires: [ConfigModule],
  // injectOptionFrom: 'config.redis.filter',
}, {
  name: 'throttle',
  options: {port: 6379, host: 'localhost', db: 4},
  // requires: [ConfigModule],
  // injectOptionFrom: 'config.redis.throttle',
}]) {
  constructor(@InjectLogger(RedisModule) private logger: Logger) {
    super();
  }

  async onCreate() {
    this.logger.info('Sheng RedisModule is Creating...');
    await super.onCreate();
    this.logger.info('Sheng RedisModule is Created...');
  }

  async onDestroy() {
    this.logger.info('Sheng RedisModule is Destroying...');
    await super.onDestroy();
    this.logger.info('Sheng RedisModule is Destroyed...');
  }
}
