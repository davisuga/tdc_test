import { createClient } from 'redis';
import { Queue } from 'bullmq';
import { config } from 'dotenv';

config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis client
export const redisClient = createClient({
  url: redisUrl,
});

// Connect to Redis
redisClient.on('error', (err) => console.log('Redis Client Error', err));

let isConnected = false;

export async function connectRedis() {
  if (!isConnected) {
    await redisClient.connect();
    isConnected = true;
    console.log('✅ Connected to Redis');
  }
}

// Create BullMQ queues
export const photoProcessingQueue = new Queue('photo-processing', {
  connection: {
    host: 'localhost',
    port: 6379,
  },
});

export const appraisalQueue = new Queue('appraisal-processing', {
  connection: {
    host: 'localhost',
    port: 6379,
  },
});

// Initialize Redis connection
connectRedis().catch(console.error);