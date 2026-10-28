import productsData from './products.json';

export const products = productsData;

export const categories = [
  'All Categories',
  'Electronics',
  'Fashion',
  'Home & Kitchen',
  'Books',
];

export const heroBanners = [
  {
    id: 1,
    title: 'Up to 50% Off | Electronics & Smart Devices',
    subtitle: 'Noise-canceling headphones, M3 MacBooks, 4K TVs and more with next-day delivery.',
    image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1600&q=80',
    link: '/products?category=Electronics',
    tag: 'Big Electronics Sale'
  },
  {
    id: 2,
    title: 'Autumn Fashion Trends & Premium Outerwear',
    subtitle: 'Classic denim truckers, leather jackets, and street footwear at unbeatable prices.',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80',
    link: '/products?category=Fashion',
    tag: 'Fashion Hub'
  },
  {
    id: 3,
    title: 'Upgrade Your Living Space | Home & Kitchen',
    subtitle: 'De\'Longhi espresso machines, Ninja DualZone air fryers, and smart robot vacuums.',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1600&q=80',
    link: '/products?category=Home%20%26%20Kitchen',
    tag: 'Smart Home Essentials'
  },
  {
    id: 4,
    title: 'Books, Engineering & Bestsellers',
    subtitle: 'System architecture, personal productivity, and timeless classics for lifelong learners.',
    image: 'https://images.unsplash.com/photo-1507842229457-7e9a263d9061?w=1600&q=80',
    link: '/products?category=Books',
    tag: 'Knowledge Corner'
  }
];

export function getProductById(id) {
  return products.find((p) => p.id === id) || null;
}

export function getProductsByCategory(category) {
  if (!category || category === 'All Categories' || category === 'All') {
    return products;
  }
  return products.filter((p) => p.category.toLowerCase() === category.toLowerCase());
}

export function searchProducts({
  query = '',
  category = 'All Categories',
  minPrice = 0,
  maxPrice = Infinity,
  minRating = 0,
  primeOnly = false,
  brand = null,
  sortBy = 'featured'
} = {}) {
  let results = [...products];

  // Category filter
  if (category && category !== 'All Categories' && category !== 'All') {
    results = results.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }

  // Search keyword query
  if (query && query.trim() !== '') {
    const q = query.toLowerCase().trim();
    results = results.filter((p) => 
      p.title.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.subCategory.toLowerCase().includes(q) ||
      p.features.some((f) => f.toLowerCase().includes(q))
    );
  }

  // Price range filter
  results = results.filter((p) => p.price >= minPrice && p.price <= maxPrice);

  // Rating filter
  if (minRating > 0) {
    results = results.filter((p) => p.rating >= minRating);
  }

  // Prime fast shipping only
  if (primeOnly) {
    results = results.filter((p) => p.isPrime);
  }

  // Brand filter
  if (brand) {
    results = results.filter((p) => p.brand.toLowerCase() === brand.toLowerCase());
  }

  // Sorting logic
  switch (sortBy) {
    case 'price-asc':
      results.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      results.sort((a, b) => b.price - a.price);
      break;
    case 'rating-desc':
      results.sort((a, b) => b.rating - a.rating);
      break;
    case 'newest':
      results.sort((a, b) => b.reviewCount - a.reviewCount);
      break;
    case 'featured':
    default:
      // Keep natural priority (sponsored/badges/rating)
      results.sort((a, b) => (b.badge ? 1 : 0) - (a.badge ? 1 : 0));
      break;
  }

  return results;
}

export function getDeals() {
  return products.filter((p) => p.discountPercentage >= 25);
}

export function getBestSellers() {
  return products.filter((p) => p.badge === 'Best Seller' || p.badge === '#1 Best Seller');
}
