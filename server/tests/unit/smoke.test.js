import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import * as dbConfig from '../../src/config/database.js';

describe('Server API Health Endpoint', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 200 OK and show database as connected when ready', async () => {
    vi.spyOn(dbConfig, 'getDatabaseStatus').mockReturnValue({
      state: 'connected',
      readyState: 1,
      isConnected: true,
    });

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('ThriftSync API');
    expect(res.body.database.status).toBe('connected');
    expect(res.body.database.ready).toBe(true);
    expect(res.body.timestamp).toBeDefined();
  });

  it('should return 200 OK and distinguish when database is disconnected', async () => {
    vi.spyOn(dbConfig, 'getDatabaseStatus').mockReturnValue({
      state: 'disconnected',
      readyState: 0,
      isConnected: false,
    });

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database.status).toBe('disconnected');
    expect(res.body.database.ready).toBe(false);
  });
});
