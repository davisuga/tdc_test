import { createClient } from 'redis';
import { Queue } from 'bullmq';
import { config } from 'dotenv';

config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis client only when needed
let redisClient: ReturnType<typeof createClient> | null = null;
let isConnected = false;

export async function connectRedis() {
  if (!isConnected && !redisClient) {
    try {
      redisClient = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: false, // Don't retry connections
        },
      });

      // Handle errors more gracefully
      redisClient.on('error', (err) => {
        if (process.env.NODE_ENV !== 'test') {
          console.warn('Redis connection error:', err.message);
        }
      });

      await redisClient.connect();
      isConnected = true;
      console.log('✅ Connected to Redis');
    } catch (error) {
      console.warn('⚠️  Failed to connect to Redis:', (error as Error).message);
      redisClient = null;
      throw error;
    }
  }
}

// Create BullMQ queues - only if Redis is available
let photoProcessingQueue: Queue | null = null;
let appraisalQueue: Queue | null = null;

function initializeQueues() {
  if (!isConnected || !redisClient) {
    console.warn('⚠️  Redis not available, skipping queue initialization');
    return;
  }

  try {
    photoProcessingQueue = new Queue('photo-processing', {
      connection: {
        host: 'localhost',
        port: 6379,
      },
    });

    appraisalQueue = new Queue('appraisal-processing', {
      connection: {
        host: 'localhost',
        port: 6379,
      },
    });
    console.log('✅ BullMQ queues initialized');
  } catch (error) {
    console.warn('⚠️  Failed to initialize BullMQ queues:', (error as Error).message);
  }
}

export { redisClient, photoProcessingQueue, appraisalQueue, initializeQueues };