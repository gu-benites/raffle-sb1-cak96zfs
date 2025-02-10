import { Redis } from '@upstash/redis'

// Crie uma função para inicializar o Redis
function createRedisClient() {
  try {
    return new Redis({
      url: import.meta.env.VITE_UPSTASH_REDIS_REST_URL || '',
      token: import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN || ''
    });
  } catch (error) {
    console.error('Erro ao criar cliente Redis:', error);
    return null;
  }
}

const redis = createRedisClient();

// Função de teste
export async function testRedisConnection() {
  try {
    // Tenta salvar um valor
    await redis.set('test-key', 'test-value');
    
    // Tenta ler o valor
    const value = await redis.get('test-key');
    
    // Deleta o valor de teste
    await redis.del('test-key');
    
    console.log('Redis connection test:', {
      success: true,
      value,
      url: import.meta.env.VITE_UPSTASH_REDIS_REST_URL?.substring(0, 20) + '...',
      hasToken: !!import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN
    });
    
    return true;
  } catch (error) {
    console.error('Redis connection test failed:', error);
    return false;
  }
}

// Execute o teste quando o módulo for carregado
testRedisConnection();

export const reservationService = {
  // Chave do Redis: raffle:{raffle_id}:reservations
  async reserveNumbers(raffleId: string, numbers: number[], userId: string) {
    if (!redis) throw new Error('Cliente Redis não inicializado');
    
    const key = `raffle:${raffleId}:reservations`;
    const reservationTime = 15 * 60; // 15 minutos em segundos

    // Verificar se os números já estão reservados
    const currentReservations = await redis.hgetall(key);
    const reservedNumbers = Object.keys(currentReservations || {}).map(Number);
    
    const conflictingNumbers = numbers.filter(n => reservedNumbers.includes(n));
    if (conflictingNumbers.length > 0) {
      throw new Error(`Números já reservados: ${conflictingNumbers.join(', ')}`);
    }

    // Criar reservas
    const reservations = numbers.reduce((acc, number) => ({
      ...acc,
      [number]: JSON.stringify({
        userId,
        timestamp: Date.now()
      })
    }), {});

    // Salvar no Redis com expiração
    await redis.hset(key, reservations);
    await redis.expire(key, reservationTime);

    return true;
  },

  async checkReservation(raffleId: string, numbers: number[]) {
    const key = `raffle:${raffleId}:reservations`;
    const reservations = await redis.hmget(key, ...numbers.map(String));
    
    return reservations.map((r, i) => ({
      number: numbers[i],
      isReserved: !!r,
      reservation: r ? JSON.parse(r) : null
    }));
  },

  async removeReservation(raffleId: string, numbers: number[]) {
    const key = `raffle:${raffleId}:reservations`;
    await redis.hdel(key, ...numbers.map(String));
    return true;
  },

  async testConnection() {
    if (!redis) {
      console.error('Cliente Redis não inicializado');
      return false;
    }

    try {
      // Tenta salvar um valor
      await redis.set('test-key', 'test-value');
      
      // Tenta ler o valor
      const value = await redis.get('test-key');
      
      // Deleta o valor de teste
      await redis.del('test-key');
      
      console.log('Redis connection test:', {
        success: true,
        value,
        url: import.meta.env.VITE_UPSTASH_REDIS_REST_URL?.substring(0, 20) + '...',
        hasToken: !!import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN
      });
      
      return true;
    } catch (error) {
      console.error('Redis connection test failed:', error);
      return false;
    }
  }
};

// Expor para testes
if (import.meta.env.DEV) {
  (window as any).reservationService = reservationService;
  (window as any).testRedisConnection = testRedisConnection;
} 