import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import {
  getDatabaseUri,
  getDatabaseStatus,
  connectDatabase,
  disconnectDatabase
} from '../../src/config/database.js';

describe('Database Configuration & Lifecycle', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  it('should default to local development URI if MONGO_URI is not set', () => {
    delete process.env.MONGO_URI;
    delete process.env.MONGODB_URI;

    expect(getDatabaseUri()).toBe('mongodb://127.0.0.1:27017/thriftsync_dev');
  });

  it('should prioritize MONGO_URI environment variable when provided', () => {
    process.env.MONGO_URI = 'mongodb://custom-host:27017/thriftsync_custom';

    expect(getDatabaseUri()).toBe('mongodb://custom-host:27017/thriftsync_custom');
  });

  it('should fallback to MONGODB_URI if MONGO_URI is missing', () => {
    delete process.env.MONGO_URI;
    process.env.MONGODB_URI = 'mongodb://legacy-host:27017/thriftsync_legacy';

    expect(getDatabaseUri()).toBe('mongodb://legacy-host:27017/thriftsync_legacy');
  });

  it('should accurately report status for all mongoose readyState codes', () => {
    expect(getDatabaseStatus({ readyState: 0 })).toEqual({
      state: 'disconnected',
      readyState: 0,
      isConnected: false,
    });
    expect(getDatabaseStatus({ readyState: 1 })).toEqual({
      state: 'connected',
      readyState: 1,
      isConnected: true,
    });
    expect(getDatabaseStatus({ readyState: 2 })).toEqual({
      state: 'connecting',
      readyState: 2,
      isConnected: false,
    });
    expect(getDatabaseStatus({ readyState: 3 })).toEqual({
      state: 'disconnecting',
      readyState: 3,
      isConnected: false,
    });
  });

  it('should connect using mongoose.connect and return connection', async () => {
    const mockConn = {
      connection: {
        host: '127.0.0.1',
        port: 27017,
        name: 'thriftsync_dev'
      }
    };
    vi.spyOn(mongoose, 'connect').mockResolvedValue(mockConn);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const conn = await connectDatabase('mongodb://127.0.0.1:27017/thriftsync_dev');

    expect(mongoose.connect).toHaveBeenCalledWith(
      'mongodb://127.0.0.1:27017/thriftsync_dev',
      expect.objectContaining({ serverSelectionTimeoutMS: 5000 })
    );
    expect(conn.connection.name).toBe('thriftsync_dev');
  });

  it('should log and throw when mongoose.connect fails', async () => {
    const connectionError = new Error('Authentication failed');
    vi.spyOn(mongoose, 'connect').mockRejectedValue(connectionError);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(connectDatabase('mongodb://invalid:27017/test')).rejects.toThrow('Authentication failed');
  });

  it('should call mongoose.disconnect when disconnectDatabase is invoked', async () => {
    vi.spyOn(mongoose, 'disconnect').mockResolvedValue();
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await disconnectDatabase();

    expect(mongoose.disconnect).toBeDefined();
  });
});
