import {Redis} from 'ioredis';

type callback = (err: Error, res: string | null) => void;

export interface ExtRedis extends Redis {
  bfreserve(key: string, name: string, errorRate: number, minCapacity: number, callback?: callback): string;
  bfadd(key: string, name: string, item: any, callback?: callback): number;
  bfexists(key: string, name: string, item: any, callback?: callback): number;
  cfreserve(key: string, name: string, minCapacity: number, callback?: callback): string;
  cfadd(key: string, name: string, item: any, callback?: callback): number;
  cfaddnx(key: string, name: string, item: any, callback?: callback): number;
  cfcount(key: string, name: string, item: any, callback?: callback): number;
  cfexists(key: string, name: string, item: any, callback?: callback): number;
  cfdel(key: string, name: string, item: any, callback?: callback): number;
  clthrottle(key: string, capacity: number, count: number, period: number, callback?: callback): number[];
}

export function ExtRedisClient(redisClient: ExtRedis, ext: string) {
  if (ext === 'filter') {
    redisClient.defineCommand('bfreserve', {
      numberOfKeys: 3, lua: 'return redis.call("BF.RESERVE", KEYS[1], KEYS[2], KEYS[3])'
    });
    redisClient.defineCommand('bfadd', {
      numberOfKeys: 2, lua: 'return redis.call("BF.ADD", KEYS[1], KEYS[2])'
    });
    redisClient.defineCommand('bfexists', {
      numberOfKeys: 2, lua: 'return redis.call("BF.EXISTS", KEYS[1], KEYS[2])'
    });
    redisClient.defineCommand('cfreserve', {
      numberOfKeys: 2, lua: 'return redis.call("CF.RESERVE", KEYS[1], KEYS[2])'
    });
    redisClient.defineCommand('cfadd', {
      numberOfKeys: 2, lua: 'return redis.call("CF.ADD", KEYS[1], KEYS[2])'
    });
    redisClient.defineCommand('cfaddnx', {
      numberOfKeys: 2, lua: 'return redis.call("CF.ADDNX", KEYS[1], KEYS[2])'
    });
    redisClient.defineCommand('cfcount', {
      numberOfKeys: 2, lua: 'return redis.call("CF.COUNT", KEYS[1], KEYS[2])'
    });
    redisClient.defineCommand('cfexists', {
      numberOfKeys: 2, lua: 'return redis.call("CF.EXISTS", KEYS[1], KEYS[2])'
    });
    redisClient.defineCommand('cfdel', {
      numberOfKeys: 2, lua: 'return redis.call("CF.DEL", KEYS[1], KEYS[2])'
    });
  } else if (ext === 'throttle') {
    redisClient.defineCommand('clthrottle', {
      numberOfKeys: 4, lua: 'return redis.call("CL.THROTTLE", KEYS[1], KEYS[2], KEYS[3], KEYS[4]'
    });
  }
  return redisClient;
}
