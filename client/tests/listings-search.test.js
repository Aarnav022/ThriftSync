import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchListings } from '../src/features/listings/listingService.js';
import apiClient from '../src/services/apiClient.js';

vi.mock('../src/services/apiClient.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Marketplace Search & Category Discovery Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries active listings without parameters by default', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: {
        listings: [],
        total: 0,
        page: 1,
        totalPages: 1,
      },
    });

    const result = await fetchListings();
    expect(apiClient.get).toHaveBeenCalledWith('/listings', { params: {} });
    expect(result.listings).toEqual([]);
  });

  it('passes search keyword and category filter to apiClient.get', async () => {
    const mockListings = [
      {
        _id: 'listing-1',
        title: 'Economics 10th Edition',
        category: 'Textbooks',
        condition: 'Like New',
        price: 35,
      },
    ];

    apiClient.get.mockResolvedValueOnce({
      data: {
        listings: mockListings,
        total: 1,
        page: 1,
        totalPages: 1,
      },
    });

    const filters = {
      search: 'Economics',
      category: 'Textbooks',
      condition: 'Like New',
      sort: 'price_asc',
    };

    const result = await fetchListings(filters);
    expect(apiClient.get).toHaveBeenCalledWith('/listings', { params: filters });
    expect(result.listings).toHaveLength(1);
    expect(result.listings[0].title).toBe('Economics 10th Edition');
  });

  it('aggregates multi-facet filter parameters (price bounds, condition, sort)', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: {
        listings: [],
        total: 0,
      },
    });

    const multiFacetFilters = {
      category: 'Electronics',
      condition: 'Excellent',
      minPrice: 20,
      maxPrice: 100,
      sort: 'price_desc',
      page: 2,
      limit: 15,
    };

    await fetchListings(multiFacetFilters);

    expect(apiClient.get).toHaveBeenCalledWith('/listings', {
      params: expect.objectContaining({
        category: 'Electronics',
        condition: 'Excellent',
        minPrice: 20,
        maxPrice: 100,
        sort: 'price_desc',
        page: 2,
        limit: 15,
      }),
    });
  });

  it('formats rental filter queries correctly', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: {
        listings: [
          {
            _id: 'rent-1',
            title: 'Lab Goggles & Coat',
            listingType: 'rent',
            rentalRate: 5,
            rentalPeriod: 'per semester',
          },
        ],
        total: 1,
      },
    });

    const rentalFilters = {
      listingType: 'rent',
      sort: 'rental_asc',
    };

    const res = await fetchListings(rentalFilters);
    expect(apiClient.get).toHaveBeenCalledWith('/listings', { params: rentalFilters });
    expect(res.listings[0].rentalRate).toBe(5);
  });
});
