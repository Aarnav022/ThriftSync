import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchAdminMetrics,
  fetchAdminUsers,
  updateAdminUserStatus,
  fetchAdminListings,
  updateAdminListingStatus,
  submitReport,
  fetchAdminReports,
  resolveAdminReport,
} from '../src/features/administration/adminService.js';
import apiClient from '../src/services/apiClient.js';

vi.mock('../src/services/apiClient.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('Campus Administration & Moderation Client Service Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches campus admin metrics overview', async () => {
    const mockMetrics = {
      users: { total: 120, active: 115, admins: 2 },
      listings: { total: 45, active: 40, pendingSwaps: 3, activeRentals: 2 },
      swaps: { total: 15, pending: 3, accepted: 8, completed: 4 },
      rentals: { total: 10, requested: 1, active: 4, returned: 5, totalDepositsHeld: 150 },
      orders: { total: 25, paid: 5, completed: 20, grossVolume: 420 },
      reviews: { total: 30, verifiedOnly: true },
      moderation: { totalReports: 2, pendingReports: 1, resolvedReports: 1 },
    };

    apiClient.get.mockResolvedValueOnce({ data: { metrics: mockMetrics } });

    const result = await fetchAdminMetrics();
    expect(apiClient.get).toHaveBeenCalledWith('/admin/metrics');
    expect(result.users.total).toBe(120);
    expect(result.moderation.pendingReports).toBe(1);
  });

  it('submits a student moderation report', async () => {
    const mockReportPayload = {
      targetType: 'listing',
      targetId: 'list-101',
      reason: 'prohibited_item',
      description: 'Suspicious counterfeit electronics item.',
    };

    const mockReportResponse = {
      _id: 'rep-1',
      ...mockReportPayload,
      reporter: 'user-1',
      status: 'pending',
    };

    apiClient.post.mockResolvedValueOnce({ data: { report: mockReportResponse } });

    const res = await submitReport(mockReportPayload);
    expect(apiClient.post).toHaveBeenCalledWith('/admin/reports', mockReportPayload);
    expect(res._id).toBe('rep-1');
    expect(res.status).toBe('pending');
  });

  it('fetches admin moderation queue with status filter', async () => {
    const mockData = {
      reports: [
        {
          _id: 'rep-1',
          targetType: 'listing',
          targetId: { _id: 'list-101', title: 'Suspicious Book' },
          reason: 'misleading_description',
          status: 'pending',
          reporter: { name: 'Alice Student', email: 'alice@campus.edu' },
        },
      ],
      total: 1,
    };

    apiClient.get.mockResolvedValueOnce({ data: mockData });

    const result = await fetchAdminReports({ status: 'pending' });
    expect(apiClient.get).toHaveBeenCalledWith('/admin/reports', {
      params: { status: 'pending' },
    });
    expect(result.reports).toHaveLength(1);
    expect(result.reports[0].reason).toBe('misleading_description');
  });

  it('resolves a moderation report with disciplinary action', async () => {
    const mockResolution = {
      status: 'resolved',
      action: 'SUSPEND_LISTING',
      adminNotes: 'Confirmed violation of textbook guidelines.',
    };

    const mockResolvedReport = {
      _id: 'rep-1',
      status: 'resolved',
      resolutionAction: 'SUSPEND_LISTING',
      adminNotes: 'Confirmed violation of textbook guidelines.',
    };

    apiClient.patch.mockResolvedValueOnce({ data: { report: mockResolvedReport } });

    const res = await resolveAdminReport('rep-1', mockResolution);
    expect(apiClient.patch).toHaveBeenCalledWith('/admin/reports/rep-1', mockResolution);
    expect(res.status).toBe('resolved');
    expect(res.resolutionAction).toBe('SUSPEND_LISTING');
  });

  it('updates student active account status', async () => {
    const mockUser = {
      _id: 'usr-99',
      name: 'Bob Student',
      isActive: false,
    };

    apiClient.patch.mockResolvedValueOnce({ data: { user: mockUser } });

    const res = await updateAdminUserStatus('usr-99', false);
    expect(apiClient.patch).toHaveBeenCalledWith('/admin/users/usr-99/status', {
      isActive: false,
    });
    expect(res.isActive).toBe(false);
  });
});
