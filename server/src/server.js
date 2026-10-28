import dotenv from 'dotenv';
// Load environment variables before importing modules that depend on env vars
dotenv.config();

import app from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // 1. Connect to database first
    await connectDatabase();

    // 2. Start listening only after database connection succeeds
    const server = app.listen(PORT, () => {
      console.log(`ThriftSync API server running on port ${PORT}`);
    });

    // Graceful shutdown handling
    const handleShutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        try {
          await disconnectDatabase();
          console.log('HTTP server and database connections closed cleanly.');
          process.exit(0);
        } catch (err) {
          console.error('Error during database disconnect:', err.message);
          process.exit(1);
        }
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));

    return server;
  } catch (error) {
    console.error(`Fatal: Failed to connect to database. Server aborting startup: ${error.message}`);
    process.exit(1);
  }
}

startServer();
