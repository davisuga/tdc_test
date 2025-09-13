import { createYoga } from 'graphql-yoga';
import { createServer } from 'node:http';
import { config } from 'dotenv';
import { schema } from './schema.js';
import { initializeS3, testS3Upload } from './setup.js';
import { connectRedis, initializeQueues } from './redis.js';
import { Database } from './database.js';

// Load environment variables
config();

const PORT = process.env.PORT || 4000;

// Initialize services
async function initializeServices() {
  try {
    console.log('🔧 Initializing services...');
    
    // Connect to database (PostgreSQL or in-memory fallback)
    await Database.connect();
    
    // Seed database with test data
    await Database.seedDatabase();
    
    // Initialize S3/MinIO (graceful failure in CI)
    try {
      await initializeS3();
      await testS3Upload();
      console.log('✅ S3/MinIO initialized successfully');
    } catch (error) {
      console.warn('⚠️  S3/MinIO initialization failed, continuing without it:', error);
    }
    
    // Initialize Redis (graceful failure in CI)
    try {
      await connectRedis();
      initializeQueues();
      console.log('✅ Redis initialized successfully');
    } catch (error) {
      console.warn('⚠️  Redis initialization failed, continuing without it:', error);
    }
    
    console.log('✅ Core services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize core services:', error);
    process.exit(1);
  }
}

// Create GraphQL Yoga server
const yoga = createYoga({
  schema,
  graphiql: true, // Enable GraphiQL interface
  context: () => ({}),
  maskedErrors: false, // Show real error messages in development
});

// Create HTTP server
const server = createServer(yoga);

// Start server
async function startServer() {
  await initializeServices();
  
  server.listen(PORT, () => {
    console.log(`🚀 GraphQL server is running on http://localhost:${PORT}/graphql`);
    console.log(`📊 GraphiQL interface available at http://localhost:${PORT}/graphql`);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  await Database.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down gracefully...');
  await Database.disconnect();
  process.exit(0);
});

startServer().catch(console.error);