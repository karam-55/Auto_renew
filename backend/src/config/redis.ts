import Redis from 'ioredis';
import { Logger } from '../infrastructure/logging/logger';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
});

redis.on('connect', () => {
  Logger.debug('Redis connected');
});

redis.on('error', (err) => {
  Logger.error('Redis error', err);
});

export default redis;
