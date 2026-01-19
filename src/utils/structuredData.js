/**
 * Structured Data Utility
 * Generates JSON-LD structured data for various schema types
 * Follows Schema.org standards for better SEO and rich snippets
 */

const baseUrl = import.meta.env.VITE_APP_URL || 'https://stylehub.com';

/**
 * Generate Organization Schema
 * Used for company/brand information
 */
export const generateOrganizationSchema = ({
  name = 'StyleHub',
  url = baseUrl,
  logo = `${baseUrl}/logo.png`,
  description = 'Your one-stop shop for fashion and style',
  contactPoint = {
    telephone: '+1-XXX-XXX-XXXX',
    contactType: 'customer service',
    email: 'support@stylehub.com'
  },
  sameAs = [
    'https://www.facebook.com/stylehub',
    'https://www.twitter.com/stylehub',
    'https://www.instagram.com/stylehub',
    'https://www.linkedin.com/company/stylehub'
  ]
} = {}) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name,
  url,
  logo: {
    '@type': 'ImageObject',
    url: logo
  },
  description,
  contactPoint: {
    '@type': 'ContactPoint',
    ...contactPoint
  },
  sameAs
});

/**
 * Generate Product Schema
 * Used for product detail pages
 */
export const generateProductSchema = ({
  name,
  description,
  image,
  sku,
  brand = 'StyleHub',
  price,
  currency = 'USD',
  availability = 'https://schema.org/InStock',
  condition = 'https://schema.org/NewCondition',
  url,
  rating,
  reviewCount,
  reviews = []
}) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: Array.isArray(image) ? image : [image],
    sku,
    brand: {
      '@type': 'Brand',
      name: brand
    },
    offers: {
      '@type': 'Offer',
      url: url || `${baseUrl}/product/${sku}`,
      priceCurrency: currency,
      price: parseFloat(price).toFixed(2),
      availability,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      itemCondition: condition
    }
  };

  // Add aggregate rating if available
  if (rating && reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating,
      reviewCount: reviewCount,
      bestRating: '5',
      worstRating: '1'
    };
  }

  // Add reviews if available
  if (reviews.length > 0) {
    schema.review = reviews.map(review => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: review.author || 'Anonymous'
      },
      datePublished: review.date,
      reviewBody: review.comment,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
        bestRating: '5',
        worstRating: '1'
      }
    }));
  }

  return schema;
};

/**
 * Generate BreadcrumbList Schema
 * Used for navigation breadcrumbs
 */
export const generateBreadcrumbSchema = (breadcrumbs) => {
  if (!breadcrumbs || breadcrumbs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url?.startsWith('http') ? crumb.url : `${baseUrl}${crumb.url}`
    }))
  };
};

/**
 * Generate Review Schema
 * Used for product reviews
 */
export const generateReviewSchema = ({
  productName,
  author,
  datePublished,
  reviewBody,
  rating,
  bestRating = 5,
  worstRating = 1
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Review',
  itemReviewed: {
    '@type': 'Product',
    name: productName
  },
  author: {
    '@type': 'Person',
    name: author
  },
  datePublished,
  reviewBody,
  reviewRating: {
    '@type': 'Rating',
    ratingValue: rating,
    bestRating,
    worstRating
  }
});

/**
 * Generate WebSite Schema
 * Used for homepage
 */
export const generateWebSiteSchema = ({
  name = 'StyleHub',
  url = baseUrl,
  description = 'Your one-stop shop for fashion and style',
  potentialAction
} = {}) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    description
  };

  // Add search action for site search
  if (potentialAction !== false) {
    schema.potentialAction = {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    };
  }

  return schema;
};

/**
 * Generate WebPage Schema
 * Used for general pages
 */
export const generateWebPageSchema = ({
  name,
  description,
  url,
  breadcrumbs,
  datePublished,
  dateModified,
  author
}) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url: url?.startsWith('http') ? url : `${baseUrl}${url}`
  };

  if (datePublished) schema.datePublished = datePublished;
  if (dateModified) schema.dateModified = dateModified;

  if (author) {
    schema.author = {
      '@type': 'Person',
      name: author
    };
  }

  if (breadcrumbs) {
    schema.breadcrumb = generateBreadcrumbSchema(breadcrumbs);
  }

  return schema;
};

/**
 * Generate ItemList Schema
 * Used for product listings and category pages
 */
export const generateItemListSchema = ({
  name,
  description,
  url,
  items = []
}) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name,
  description,
  url: url?.startsWith('http') ? url : `${baseUrl}${url}`,
  numberOfItems: items.length,
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: item.url?.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    name: item.name,
    image: item.image
  }))
});

/**
 * Generate Offer Schema
 * Used for special offers and deals
 */
export const generateOfferSchema = ({
  name,
  description,
  price,
  currency = 'USD',
  availability = 'https://schema.org/InStock',
  validFrom,
  validThrough,
  url
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Offer',
  name,
  description,
  price: parseFloat(price).toFixed(2),
  priceCurrency: currency,
  availability,
  validFrom,
  priceValidUntil: validThrough,
  url: url?.startsWith('http') ? url : `${baseUrl}${url}`
});

/**
 * Generate FAQ Schema
 * Used for FAQ pages
 */
export const generateFAQSchema = (faqs = []) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer
    }
  }))
});

/**
 * Generate Article Schema
 * Used for blog posts and articles
 */
export const generateArticleSchema = ({
  headline,
  description,
  image,
  author,
  datePublished,
  dateModified,
  publisher = 'StyleHub',
  url
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline,
  description,
  image: Array.isArray(image) ? image : [image],
  author: {
    '@type': 'Person',
    name: author
  },
  publisher: {
    '@type': 'Organization',
    name: publisher,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/logo.png`
    }
  },
  datePublished,
  dateModified: dateModified || datePublished,
  url: url?.startsWith('http') ? url : `${baseUrl}${url}`
});

/**
 * Generate combined schema with multiple types
 * Useful for complex pages with multiple schema types
 */
export const generateCombinedSchema = (...schemas) => {
  const validSchemas = schemas.filter(schema => schema && typeof schema === 'object');

  if (validSchemas.length === 0) return null;
  if (validSchemas.length === 1) return validSchemas[0];

  return {
    '@context': 'https://schema.org',
    '@graph': validSchemas
  };
};

/**
 * Helper function to get availability string from stock status
 */
export const getAvailabilityStatus = (inStock, quantity = 0) => {
  if (!inStock || quantity === 0) {
    return 'https://schema.org/OutOfStock';
  }
  if (quantity < 5) {
    return 'https://schema.org/LimitedAvailability';
  }
  return 'https://schema.org/InStock';
};

/**
 * Helper function to get product condition
 */
export const getProductCondition = (condition = 'new') => {
  const conditionMap = {
    new: 'https://schema.org/NewCondition',
    used: 'https://schema.org/UsedCondition',
    refurbished: 'https://schema.org/RefurbishedCondition',
    damaged: 'https://schema.org/DamagedCondition'
  };

  return conditionMap[condition.toLowerCase()] || conditionMap.new;
};

// Default export with all functions
export default {
  generateOrganizationSchema,
  generateProductSchema,
  generateBreadcrumbSchema,
  generateReviewSchema,
  generateWebSiteSchema,
  generateWebPageSchema,
  generateItemListSchema,
  generateOfferSchema,
  generateFAQSchema,
  generateArticleSchema,
  generateCombinedSchema,
  getAvailabilityStatus,
  getProductCondition
};
