import Listing from './listingModel.js';

/**
 * Creates a new campus listing under the authenticated seller.
 */
export async function createListing(userId, listingData) {
  const listing = new Listing({
    ...listingData,
    seller: userId,
  });

  await listing.save();
  await listing.populate('seller', '_id name campus avatar');
  return listing;
}

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Retrieves public active listings with filtering, search, and pagination.
 */
export async function getListings(filters = {}) {
  const query = {};

  // Status filter (default to 'active' for marketplace catalog)
  if (filters.status && filters.status !== 'all') {
    query.status = filters.status;
  } else if (!filters.status) {
    query.status = 'active';
  }

  // Category filter
  if (filters.category && filters.category !== 'all') {
    query.category = filters.category;
  }

  // Condition filter
  if (filters.condition && filters.condition !== 'all') {
    query.condition = filters.condition;
  }

  // Listing type filter (buy, rent, swap, buy_and_rent)
  if (filters.listingType && filters.listingType !== 'all') {
    if (filters.listingType === 'buy') {
      query.listingType = { $in: ['buy', 'buy_and_rent'] };
    } else if (filters.listingType === 'rent') {
      query.listingType = { $in: ['rent', 'buy_and_rent'] };
    } else {
      query.listingType = filters.listingType;
    }
  }

  // Campus filter
  if (filters.campus && filters.campus !== 'all') {
    query.campus = filters.campus;
  }

  // Keyword search with ReDoS protection
  if (filters.search && filters.search.trim()) {
    const escaped = escapeRegex(filters.search.trim());
    const searchRegex = new RegExp(escaped, 'i');
    query.$or = [{ title: searchRegex }, { description: searchRegex }];
  }

  // Price range filters
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const priceConditions = {};
    if (filters.minPrice !== undefined && !isNaN(Number(filters.minPrice))) {
      priceConditions.$gte = Number(filters.minPrice);
    }
    if (filters.maxPrice !== undefined && !isNaN(Number(filters.maxPrice))) {
      priceConditions.$lte = Number(filters.maxPrice);
    }
    if (Object.keys(priceConditions).length > 0) {
      query.price = priceConditions;
    }
  }

  // Rental rate range filters
  if (filters.minRentalRate !== undefined || filters.maxRentalRate !== undefined) {
    const rentalConditions = {};
    if (filters.minRentalRate !== undefined && !isNaN(Number(filters.minRentalRate))) {
      rentalConditions.$gte = Number(filters.minRentalRate);
    }
    if (filters.maxRentalRate !== undefined && !isNaN(Number(filters.maxRentalRate))) {
      rentalConditions.$lte = Number(filters.maxRentalRate);
    }
    if (Object.keys(rentalConditions).length > 0) {
      query.rentalRate = rentalConditions;
    }
  }

  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(filters.limit, 10) || 20));
  const skip = (page - 1) * limit;

  // Sorting
  let sort = { createdAt: -1 };
  if (filters.sort === 'price_asc') {
    sort = { price: 1, createdAt: -1 };
  } else if (filters.sort === 'price_desc') {
    sort = { price: -1, createdAt: -1 };
  } else if (filters.sort === 'rental_asc') {
    sort = { rentalRate: 1, createdAt: -1 };
  } else if (filters.sort === 'rental_desc') {
    sort = { rentalRate: -1, createdAt: -1 };
  } else if (filters.sort === 'oldest') {
    sort = { createdAt: 1 };
  }

  const [listings, total] = await Promise.all([
    Listing.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('seller', '_id name campus avatar'),
    Listing.countDocuments(query),
  ]);

  return {
    listings,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * Retrieves all listings posted by a specific student.
 */
export async function getMyListings(userId) {
  return Listing.find({ seller: userId })
    .sort({ createdAt: -1 })
    .populate('seller', '_id name campus avatar');
}

/**
 * Retrieves a single listing by its ID.
 */
export async function getListingById(id) {
  return Listing.findById(id).populate('seller', '_id name campus avatar');
}

/**
 * Updates an existing listing, enforcing seller ownership or admin rights.
 */
export async function updateListing(id, user, updateData) {
  const listing = await Listing.findById(id);

  if (!listing) {
    const error = new Error('Listing not found');
    error.statusCode = 404;
    throw error;
  }

  const isOwner = listing.seller.toString() === user._id.toString();
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAdmin) {
    const error = new Error('Access denied: You do not have permission to modify this listing');
    error.statusCode = 403;
    throw error;
  }

  Object.assign(listing, updateData);
  await listing.save();
  await listing.populate('seller', '_id name campus avatar');
  return listing;
}

/**
 * Archives a listing, enforcing seller ownership or admin rights.
 */
export async function deleteListing(id, user) {
  const listing = await Listing.findById(id);

  if (!listing) {
    const error = new Error('Listing not found');
    error.statusCode = 404;
    throw error;
  }

  const isOwner = listing.seller.toString() === user._id.toString();
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAdmin) {
    const error = new Error('Access denied: You do not have permission to delete this listing');
    error.statusCode = 403;
    throw error;
  }

  listing.status = 'archived';
  await listing.save();
  return listing;
}
