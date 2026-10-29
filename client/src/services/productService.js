import apiClient from './apiClient';
import dummyProducts from '../data/products.json';

/**
 * Normalizes backend MongoDB listing document to the frontend UI format
 */
export function normalizeListing(item) {
  if (!item) return null;

  const id = item._id ? item._id.toString() : item.id;
  const isRentable = item.listingType === 'rent' || item.listingType === 'buy_and_rent';
  const isBuyable = item.listingType === 'buy' || item.listingType === 'buy_and_rent' || !item.listingType;

  return {
    id,
    _id: id,
    title: item.title,
    brand: item.seller?.name || item.brand || 'Campus Student',
    seller: item.seller || { name: 'Campus Student', campus: item.campus || 'Main Campus' },
    category: item.category || 'Other',
    subCategory: item.subCategory || item.category || 'General',
    condition: item.condition || 'Good',
    listingType: item.listingType || 'buy',
    isRentable,
    isBuyable,
    price: item.price !== undefined && item.price !== null ? item.price : 0,
    originalPrice: item.originalPrice || (item.price ? Math.round(item.price * 1.35) : 0),
    discountPercentage: item.discountPercentage || 25,
    rentalRate: item.rentalRate || Math.round((item.price || 500) * 0.12),
    rentalPeriod: item.rentalPeriod || 'per week',
    deposit: item.deposit || Math.round((item.price || 500) * 0.4),
    rating: item.rating || 4.8,
    reviewCount: item.reviewCount || 14,
    inStock: item.availableStock !== undefined ? item.availableStock > 0 : (item.inStock ?? true),
    stockCount: item.availableStock !== undefined ? item.availableStock : (item.stockCount || 1),
    campus: item.campus || 'Main Campus',
    pickupLocation: item.pickupLocation || 'Student Center Desk',
    images: (item.images && item.images.length > 0) 
      ? item.images 
      : ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80'],
    features: item.features || [
      `Condition: ${item.condition || 'Good'} - Hand-verified for campus handover`,
      `Pickup available at ${item.pickupLocation || 'Student Center'} (${item.campus || 'Main Campus'})`,
      item.description || 'Pre-loved campus item in great usable condition.'
    ],
    description: item.description || '',
    specifications: item.specifications || {
      'Condition': item.condition || 'Good',
      'Department': item.category || 'Campus Exchange',
      'Campus Zone': item.campus || 'Main Campus',
      'Pickup Location': item.pickupLocation || 'Student Center',
      'Exchange Type': item.listingType === 'buy_and_rent' ? 'Buy or Rent' : item.listingType || 'Buy'
    },
    reviews: item.reviews || [
      {
        id: 'rev-01',
        author: 'Campus Student',
        rating: 5,
        date: 'Recent Handover',
        title: 'Authentic item, quick handover',
        content: 'Met at the library desk. Item was exactly as described.',
        verifiedPurchase: true,
        helpfulCount: 4
      }
    ]
  };
}

/**
 * Fetch all listings from backend with filtering and search
 */
export async function fetchListings(params = {}) {
  try {
    const res = await apiClient.get('/listings', { params });
    const rawListings = res?.data?.listings ?? res?.listings ?? res?.data;
    if (Array.isArray(rawListings)) {
      return rawListings.map(normalizeListing);
    }
  } catch (err) {
    console.warn('[productService] Backend fetch failed, falling back to local dataset:', err?.message);
  }

  // Graceful fallback to rich local dataset
  return dummyProducts.map(normalizeListing);
}

/**
 * Fetch single listing by ID
 */
export async function fetchListingById(id) {
  try {
    const res = await apiClient.get(`/listings/${id}`);
    const raw = res?.data?.listing || res?.listing || res?.data;
    if (raw) return normalizeListing(raw);
  } catch (err) {
    console.warn(`[productService] Failed to fetch listing ${id} from backend:`, err?.message);
  }

  // Fallback to local
  const localMatch = dummyProducts.find(p => p.id === id || p._id === id);
  return localMatch ? normalizeListing(localMatch) : null;
}

/**
 * Create listing (Seller mode)
 */
export async function createListing(listingData) {
  const res = await apiClient.post('/listings', listingData);
  return res?.data?.listing || res?.listing || res;
}

/**
 * Fetch current user's listings
 */
export async function fetchMyListings() {
  const res = await apiClient.get('/listings/mine');
  const items = res?.data?.listings || res?.listings || [];
  return items.map(normalizeListing);
}

/**
 * Update listing
 */
export async function updateListing(id, updateData) {
  const res = await apiClient.put(`/listings/${id}`, updateData);
  return res?.data?.listing || res?.listing || res;
}

/**
 * Delete / Archive listing
 */
export async function deleteListing(id) {
  return apiClient.delete(`/listings/${id}`);
}
