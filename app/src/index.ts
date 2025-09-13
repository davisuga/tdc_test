import { createYoga } from 'graphql-yoga';
import { createServer } from 'node:http';
import { config } from 'dotenv';
import { schema } from './schema.js';
import { initializeS3, testS3Upload } from './setup.js';
import { connectRedis } from './redis.js';

// Load environment variables
config();

const PORT = process.env.PORT || 4000;

// Initialize services
async function initializeServices() {
  try {
    console.log('🔧 Initializing services...');
    
    // Initialize S3/MinIO
    await initializeS3();
    await testS3Upload();
    
    // Initialize Redis
    await connectRedis();
    
    console.log('✅ All services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
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

startServer().catch(console.error);