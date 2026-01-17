/**
 * Banner/Offer Data Structure Reference
 *
 * This file provides examples of how banner data should be structured
 * when returned from the backend API.
 *
 * API Endpoints:
 * - GET /banners/active?position=hero - Get hero banners
 * - GET /banners/active?position=promotional - Get promotional offers
 */

// ============================================================================
// Example 1: Hero Banner (for BannerCarousel)
// ============================================================================

const heroBannerExample = {
  _id: "banner_001",
  title: "Summer Collection 2024",
  subtitle: "Trending Fashion",
  description: "Discover the hottest trends of the season with up to 50% off on selected items",
  bannerImage: "https://example.com/images/summer-banner.jpg",
  bannerType: "seasonal", // Options: flash_sale, seasonal, category, new_arrival, default
  position: "hero", // Position on page
  ctaText: "Shop Now",
  ctaLink: "/products?collection=summer",
  textColor: "#ffffff", // Hex color for text
  overlayOpacity: 40, // 0-100, overlay darkness on image
  isActive: true,
  displayOrder: 1,
  startDate: "2024-06-01T00:00:00Z",
  endDate: "2024-08-31T23:59:59Z"
};

// ============================================================================
// Example 2: Flash Sale Promotional Offer (for OfferCard)
// ============================================================================

const flashSaleOfferExample = {
  _id: "offer_001",
  title: "Up to 70% OFF",
  subtitle: "Flash Sale",
  description: "Limited time offer on all electronics",
  discount: 70, // Percentage discount
  bannerImage: "https://example.com/images/flash-sale.jpg",
  bannerType: "flash_sale",
  position: "promotional",
  ctaText: "Shop Now",
  ctaLink: "/products?discount=true",
  backgroundColor: "#dc2626", // Hex color (optional, uses gradient if not set)
  textColor: "#ffffff",
  isActive: true,
  displayOrder: 1,
  startDate: "2024-01-17T00:00:00Z",
  endDate: "2024-01-20T23:59:59Z"
};

// ============================================================================
// Example 3: Category Promotional Offer (for OfferCard)
// ============================================================================

const categoryOfferExample = {
  _id: "offer_002",
  title: "Women's Collection",
  subtitle: "New Arrivals",
  description: "Explore our latest women's fashion collection",
  discount: 30,
  bannerImage: null, // No image, will use background color/gradient
  bannerType: "category",
  position: "promotional",
  ctaText: "Explore Now",
  ctaLink: "/products?category=womens",
  backgroundColor: null, // Will use default gradient based on bannerType
  textColor: "#ffffff",
  isActive: true,
  displayOrder: 2
};

// ============================================================================
// Example 4: Seasonal Hero Banner without Image
// ============================================================================

const seasonalBannerExample = {
  _id: "banner_002",
  title: "Winter Sale is Here!",
  subtitle: "Cozy & Warm",
  description: "Get ready for winter with our exclusive collection. Free shipping on orders over ₹999",
  bannerImage: null, // No image - will show gradient background
  bannerType: "seasonal",
  position: "hero",
  ctaText: "Shop Winter Collection",
  ctaLink: "/products?season=winter",
  textColor: "#1f2937", // Dark text for light background
  overlayOpacity: 0,
  isActive: true,
  displayOrder: 2
};

// ============================================================================
// API Response Format
// ============================================================================

const apiResponseFormat = {
  success: true,
  data: {
    banners: [
      heroBannerExample,
      seasonalBannerExample
      // ... more banners
    ],
    total: 2,
    position: "hero"
  }
};

// ============================================================================
// Banner Types and Their Default Styles
// ============================================================================

const bannerTypeStyles = {
  flash_sale: {
    defaultGradient: "bg-gradient-to-r from-red-600 to-red-700",
    badge: "FLASH SALE",
    description: "Best for limited-time offers and urgent promotions"
  },
  seasonal: {
    defaultGradient: "bg-gradient-to-r from-pink-600 to-purple-600",
    badge: "SEASONAL",
    description: "Best for seasonal collections and themed promotions"
  },
  category: {
    defaultGradient: "bg-gradient-to-r from-blue-600 to-indigo-600",
    badge: "FEATURED",
    description: "Best for highlighting specific product categories"
  },
  new_arrival: {
    defaultGradient: "bg-gradient-to-r from-green-600 to-teal-600",
    badge: "NEW",
    description: "Best for showcasing new products and collections"
  },
  default: {
    defaultGradient: "bg-gradient-to-r from-gray-700 to-gray-800",
    badge: "OFFER",
    description: "Generic banner type for general promotions"
  }
};

// ============================================================================
// Position Types
// ============================================================================

const positionTypes = {
  hero: "Main carousel at the top of the homepage",
  promotional: "Offer cards below the hero section",
  category: "Category-specific banners on category pages",
  sidebar: "Sidebar promotional banners",
  footer: "Footer promotional strips"
};

// ============================================================================
// Backend Model Example (MongoDB/Mongoose)
// ============================================================================

const bannerSchemaExample = `
const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  discount: {
    type: Number,
    min: 0,
    max: 100
  },
  bannerImage: {
    type: String,
    trim: true
  },
  bannerType: {
    type: String,
    enum: ['flash_sale', 'seasonal', 'category', 'new_arrival', 'default'],
    default: 'default'
  },
  position: {
    type: String,
    enum: ['hero', 'promotional', 'category', 'sidebar', 'footer'],
    required: true
  },
  ctaText: {
    type: String,
    default: 'Shop Now'
  },
  ctaLink: {
    type: String,
    required: true
  },
  backgroundColor: {
    type: String,
    trim: true
  },
  textColor: {
    type: String,
    default: '#ffffff'
  },
  overlayOpacity: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
bannerSchema.index({ position: 1, isActive: 1, displayOrder: 1 });
`;

export {
  heroBannerExample,
  flashSaleOfferExample,
  categoryOfferExample,
  seasonalBannerExample,
  apiResponseFormat,
  bannerTypeStyles,
  positionTypes,
  bannerSchemaExample
};
