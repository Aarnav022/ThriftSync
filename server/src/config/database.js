import mongoose from 'mongoose';

const DEFAULT_DEV_URI = 'mongodb://127.0.0.1:27017/thriftsync_dev';

export function getDatabaseUri() {
  return process.env.MONGO_URI || process.env.MONGODB_URI || DEFAULT_DEV_URI;
}

export function getDatabaseStatus(connection = mongoose.connection) {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const state = connection?.readyState ?? 0;
  return {
    state: stateMap[state] || 'unknown',
    readyState: state,
    isConnected: state === 1,
  };
}

export async function connectDatabase(customUri = null) {
  const uri = customUri || getDatabaseUri();

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[database] MongoDB connected successfully to ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[database] MongoDB connection error: ${error.message}`);
    throw error;
  }
}

export async function disconnectDatabase() {
  if (mongoose.connection && mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[database] MongoDB connection closed');
  }
}

export default {
  connectDatabase,
  disconnectDatabase,
  getDatabaseStatus,
  getDatabaseUri,
};
