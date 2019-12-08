export const REDIS_CONFIG_KEY = 'redis';

export enum RedisNames {
  lockUri = 'lockUri',
  cacheUri = 'cacheUri',
  expireUri = 'expireUri',
  filterUri = 'filterUri',
  throttleUri = 'throttleUri',
}

export const KAFKA_CONFIG_KEY = 'kafka';
export const ENCRYPT_CONFIG_KEY = 'encrypt';
export const POSTGRES_CONFIG_KEY = 'postgres';

// tslint:disable-next-line:no-namespace
export namespace ExpireDuration {
  export const SensorDevice = 1 * 60;
  export const MasterMerchant = 1 * 60 * 60;
}
