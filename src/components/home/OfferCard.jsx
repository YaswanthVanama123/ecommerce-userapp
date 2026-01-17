import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

/**
 * OfferCard Component
 *
 * Displays dynamic promotional banners and offers
 *
 * Features:
 * - Multiple banner types (flash sale, seasonal, category)
 * - Dynamic images and content
 * - Responsive design
 * - Smooth hover animations
 * - CTA button with dynamic links
 */

const OfferCard = ({ offer }) => {
  // Fallback for missing data
  if (!offer) return null;

  const {
    _id,
    title = 'Special Offer',
    subtitle = 'Limited time only',
    description,
    discount,
    bannerImage,
    bannerType = 'default',
    ctaText = 'Shop Now',
    ctaLink = '/products',
    backgroundColor,
    textColor = '#ffffff',
    isActive = true
  } = offer;

  // Don't render inactive offers
  if (!isActive) return null;

  // Get background color based on banner type if not specified
  const getBgColor = () => {
    if (backgroundColor) return backgroundColor;

    switch (bannerType) {
      case 'flash_sale':
        return 'bg-gradient-to-r from-red-600 to-red-700';
      case 'seasonal':
        return 'bg-gradient-to-r from-pink-600 to-purple-600';
      case 'category':
        return 'bg-gradient-to-r from-blue-600 to-indigo-600';
      case 'new_arrival':
        return 'bg-gradient-to-r from-green-600 to-teal-600';
      default:
        return 'bg-gradient-to-r from-gray-700 to-gray-800';
    }
  };

  // Get badge text based on banner type
  const getBadgeText = () => {
    switch (bannerType) {
      case 'flash_sale':
        return 'FLASH SALE';
      case 'seasonal':
        return 'SEASONAL';
      case 'category':
        return 'FEATURED';
      case 'new_arrival':
        return 'NEW';
      default:
        return 'OFFER';
    }
  };

  return (
    <Link
      to={ctaLink}
      className="block group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
    >
      {/* Background Image or Color */}
      {bannerImage ? (
        <div className="absolute inset-0">
          <img
            src={bannerImage}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30"></div>
        </div>
      ) : (
        <div className={`absolute inset-0 ${getBgColor()}`}>
          {/* Decorative Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mb-16"></div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 p-8 md:p-10 min-h-[240px] flex flex-col justify-between">
        {/* Top Section */}
        <div>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold mb-4 uppercase tracking-wide">
            {getBadgeText()}
          </div>

          {/* Title */}
          <h3
            className="text-3xl md:text-4xl font-extrabold mb-2 leading-tight"
            style={{ color: textColor }}
          >
            {title}
          </h3>

          {/* Subtitle */}
          <p
            className="text-base md:text-lg opacity-95 mb-2"
            style={{ color: textColor }}
          >
            {subtitle}
          </p>

          {/* Description (if provided) */}
          {description && (
            <p
              className="text-sm opacity-90 mb-3 line-clamp-2"
              style={{ color: textColor }}
            >
              {description}
            </p>
          )}

          {/* Discount Badge */}
          {discount && (
            <div className="inline-block bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-bold text-lg mb-4">
              {discount}% OFF
            </div>
          )}
        </div>

        {/* CTA Button */}
        <div className="flex items-center font-semibold text-lg group-hover:translate-x-2 transition-transform duration-300">
          <span style={{ color: textColor }}>{ctaText}</span>
          <svg
            className="w-5 h-5 ml-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: textColor }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
};

OfferCard.propTypes = {
  offer: PropTypes.shape({
    _id: PropTypes.string,
    title: PropTypes.string,
    subtitle: PropTypes.string,
    description: PropTypes.string,
    discount: PropTypes.number,
    bannerImage: PropTypes.string,
    bannerType: PropTypes.oneOf(['flash_sale', 'seasonal', 'category', 'new_arrival', 'default']),
    ctaText: PropTypes.string,
    ctaLink: PropTypes.string,
    backgroundColor: PropTypes.string,
    textColor: PropTypes.string,
    isActive: PropTypes.bool
  })
};

// Loading skeleton for OfferCard
export const OfferCardSkeleton = () => (
  <div className="bg-gradient-to-br from-gray-200 to-gray-100 rounded-2xl p-8 md:p-10 min-h-[240px] animate-pulse">
    <div className="space-y-4">
      <div className="h-6 bg-gray-300 rounded w-24"></div>
      <div className="h-10 bg-gray-300 rounded w-3/4"></div>
      <div className="h-6 bg-gray-300 rounded w-2/3"></div>
      <div className="h-8 bg-gray-300 rounded w-32 mt-6"></div>
      <div className="h-6 bg-gray-300 rounded w-28"></div>
    </div>
  </div>
);

export default OfferCard;
