import Redis from 'ioredis';

const redis = new Redis({
  host: import.meta.env.VITE_REDIS_HOST,
  port: parseInt(import.meta.env.VITE_REDIS_PORT),
  password: import.meta.env.VITE_REDIS_PASSWORD,
});

export const lockNumber = async (raffleId: string, number: number, userId: string) => {
  const key = `raffle:${raffleId}:number:${number}`;
  const result = await redis.set(key, userId, 'NX', 'EX', 600); // 10 minute lock
  return result === 'OK';
};

export const unlockNumber = async (raffleId: string, number: number) => {
  const key = `raffle:${raffleId}:number:${number}`;
  await redis.del(key);
};