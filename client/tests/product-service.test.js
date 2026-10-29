import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchListings, fetchListingById } from '../src/services/productService.js';
import apiClient from '../src/services/apiClient.js';

vi.mock('../src/services/apiClient.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('productService API and fallback behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns normalized listings when backend returns non-empty array', async () => {
    const mockListings = [
      {
        _id: 'test-1',
        title: 'Algorithms Book',
        category: 'Textbooks',
        condition: 'Good',
        price: 25,
      },
    ];

    apiClient.get.mockResolvedValueOnce({
      data: { listings: mockListings },
    });

    const result = await fetchListings({ category: 'Textbooks' });
    expect(apiClient.get).toHaveBeenCalledWith('/listings', { params: { category: 'Textbooks' } });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('test-1');
    expect(result[0].title).toBe('Algorithms Book');
  });

  it('returns empty array when backend query succeeds with zero results (no silent demo fallback)', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: { listings: [] },
    });

    const result = await fetchListings({ search: 'nonexistent-item-query' });
    expect(apiClient.get).toHaveBeenCalledWith('/listings', { params: { search: 'nonexistent-item-query' } });
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('falls back to local dataset when backend fetch fails (offline/network error)', async () => {
    apiClient.get.mockRejectedValueOnce(new Error('Network unreachable'));

    const result = await fetchListings();
    expect(apiClient.get).toHaveBeenCalledWith('/listings', { params: {} });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('title');
  });

  it('returns normalized listing by ID when backend succeeds', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: { listing: { _id: 'prod-100', title: 'Lab Coat', price: 15 } },
    });

    const result = await fetchListingById('prod-100');
    expect(result.id).toBe('prod-100');
    expect(result.title).toBe('Lab Coat');
  });

  it('returns local fallback or null when backend fetch fails for specific ID', async () => {
    apiClient.get.mockRejectedValueOnce(new Error('404 Not Found'));

    const result = await fetchListingById('nonexistent-uuid-999');
    expect(result).toBeNull();
  });
});
