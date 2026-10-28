import { describe, it, expect, vi, beforeEach } from 'vitest';
import User from '../../src/modules/users/userModel.js';
import * as dbConfig from '../../src/config/database.js';
import { seedAdmin } from '../../src/scripts/seedAdmin.js';

describe('ThriftSync Administrator Seeding Script Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;
    process.exitCode = 0;
  });

  it('fails safely with exitCode 1 when ADMIN_EMAIL or ADMIN_PASSWORD is missing', async () => {
    const result = await seedAdmin();
    expect(result).toBe(false);
    expect(process.exitCode).toBe(1);
  });

  it('fails safely when ADMIN_PASSWORD is shorter than 8 characters', async () => {
    process.env.ADMIN_EMAIL = 'admin@campus.edu';
    process.env.ADMIN_PASSWORD = 'short';

    const result = await seedAdmin();
    expect(result).toBe(false);
    expect(process.exitCode).toBe(1);
  });

  it('creates new administrator when credentials are valid and user does not exist', async () => {
    process.env.ADMIN_EMAIL = 'superadmin@campus.edu';
    process.env.ADMIN_PASSWORD = 'SecureAdminPassword2026!';

    vi.spyOn(dbConfig, 'connectDatabase').mockResolvedValue({});
    vi.spyOn(dbConfig, 'disconnectDatabase').mockResolvedValue({});
    vi.spyOn(User, 'findOne').mockResolvedValue(null);
    vi.spyOn(User, 'create').mockResolvedValue({
      email: 'superadmin@campus.edu',
      role: 'admin',
    });

    const result = await seedAdmin();
    expect(result).toBe(true);
    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'superadmin@campus.edu',
        role: 'admin',
      })
    );
  });

  it('idempotently promotes existing user to role: admin without modifying other fields', async () => {
    process.env.ADMIN_EMAIL = 'existingstudent@campus.edu';
    process.env.ADMIN_PASSWORD = 'SecureAdminPassword2026!';

    const mockExisting = {
      email: 'existingstudent@campus.edu',
      role: 'student',
      isActive: false,
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(dbConfig, 'connectDatabase').mockResolvedValue({});
    vi.spyOn(dbConfig, 'disconnectDatabase').mockResolvedValue({});
    vi.spyOn(User, 'findOne').mockResolvedValue(mockExisting);

    const result = await seedAdmin();
    expect(result).toBe(true);
    expect(mockExisting.role).toBe('admin');
    expect(mockExisting.isActive).toBe(true);
    expect(mockExisting.save).toHaveBeenCalled();
  });
});
