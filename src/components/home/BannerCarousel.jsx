import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

/**
 * BannerCarousel Component
 *
 * Auto-sliding carousel for hero banners
 *
 * Features:
 * - Auto-play with configurable interval
 * - Pause on hover
 * - Navigation dots
 * - Previous/Next arrows
 * - Touch/swipe support for mobile
 * - Keyboard navigation
 * - Smooth transitions
 * - Responsive design
 */

const BannerCarousel = ({
  banners = [],
  autoPlayInterval = 5000,
  enableAutoPlay = true,
  enableSwipe = true
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const autoPlayRef = useRef(null);

  // Filter only active banners
  const activeBanners = banners.filter(banner => banner.isActive !== false);

  // Don't render if no banners
  if (!activeBanners.length) return null;

  // Navigation functions
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) =>
      prev === activeBanners.length - 1 ? 0 : prev + 1
    );
  }, [activeBanners.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) =>
      prev === 0 ? activeBanners.length - 1 : prev - 1
    );
  }, [activeBanners.length]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // Auto-play functionality
  useEffect(() => {
    if (!enableAutoPlay || isHovered || activeBanners.length <= 1) {
      return;
    }

    autoPlayRef.current = setInterval(goToNext, autoPlayInterval);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [enableAutoPlay, isHovered, goToNext, autoPlayInterval, activeBanners.length]);

  // Touch/swipe handlers
  const handleTouchStart = (e) => {
    if (!enableSwipe) return;
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (!enableSwipe) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!enableSwipe) return;
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      goToNext();
    } else if (distance < -minSwipeDistance) {
      goToPrevious();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious]);

  const currentBanner = activeBanners[currentIndex];

  return (
    <div
      className="relative w-full overflow-hidden bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="Hero banner carousel"
    >
      {/* Banner Slides */}
      <div className="relative w-full">
        {activeBanners.map((banner, index) => (
          <div
            key={banner._id || index}
            className={`transition-opacity duration-700 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0 absolute inset-0'
            }`}
            aria-hidden={index !== currentIndex}
          >
            {banner.ctaLink ? (
              <Link to={banner.ctaLink} className="block">
                <BannerSlide banner={banner} />
              </Link>
            ) : (
              <BannerSlide banner={banner} />
            )}
          </div>
        ))}
      </div>

      {/* Previous/Next Arrows - Only show if more than 1 banner */}
      {activeBanners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 z-10 focus:outline-none focus:ring-2 focus:ring-pink-500"
            aria-label="Previous banner"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 z-10 focus:outline-none focus:ring-2 focus:ring-pink-500"
            aria-label="Next banner"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Navigation Dots - Only show if more than 1 banner */}
      {activeBanners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {activeBanners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                index === currentIndex
                  ? 'w-8 h-3 bg-white'
                  : 'w-3 h-3 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentIndex}
            />
          ))}
        </div>
      )}

      {/* Pause indicator (shown when hovered) */}
      {enableAutoPlay && isHovered && activeBanners.length > 1 && (
        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium z-10">
          <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          Paused
        </div>
      )}
    </div>
  );
};

// Banner Slide Component
const BannerSlide = ({ banner }) => {
  const {
    title = 'Welcome',
    subtitle,
    description,
    bannerImage,
    ctaText = 'Shop Now',
    textColor = '#1f2937',
    overlayOpacity = 0
  } = banner;

  return (
    <div className="relative w-full">
      {/* Background Image */}
      {bannerImage && (
        <>
          <img
            src={bannerImage}
            alt={title}
            className="w-full h-[400px] md:h-[500px] lg:h-[600px] object-cover"
            loading="lazy"
          />
          {/* Overlay */}
          {overlayOpacity > 0 && (
            <div
              className="absolute inset-0 bg-black"
              style={{ opacity: overlayOpacity / 100 }}
            />
          )}
        </>
      )}

      {/* Content Overlay */}
      <div className={`${bannerImage ? 'absolute inset-0' : 'relative'} flex items-center`}>
        <div className="w-full px-4 max-w-7xl mx-auto py-16 md:py-20 lg:py-28">
          <div className="max-w-3xl">
            {/* Subtitle Badge */}
            {subtitle && (
              <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-700 px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fadeIn">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {subtitle}
              </div>
            )}

            {/* Title */}
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight animate-fadeInUp"
              style={{ color: textColor }}
            >
              {title}
            </h1>

            {/* Description */}
            {description && (
              <p
                className="text-lg md:text-xl lg:text-2xl mb-10 leading-relaxed animate-fadeInUp animation-delay-200"
                style={{ color: textColor, opacity: 0.9 }}
              >
                {description}
              </p>
            )}

            {/* CTA Button */}
            {ctaText && (
              <div className="animate-fadeInUp animation-delay-400">
                <span className="inline-flex items-center justify-center bg-pink-600 text-white px-10 py-4 rounded-xl font-bold hover:bg-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer">
                  {ctaText}
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

BannerSlide.propTypes = {
  banner: PropTypes.shape({
    title: PropTypes.string,
    subtitle: PropTypes.string,
    description: PropTypes.string,
    bannerImage: PropTypes.string,
    ctaText: PropTypes.string,
    textColor: PropTypes.string,
    overlayOpacity: PropTypes.number
  }).isRequired
};

BannerCarousel.propTypes = {
  banners: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      title: PropTypes.string,
      subtitle: PropTypes.string,
      description: PropTypes.string,
      bannerImage: PropTypes.string,
      ctaText: PropTypes.string,
      ctaLink: PropTypes.string,
      textColor: PropTypes.string,
      overlayOpacity: PropTypes.number,
      isActive: PropTypes.bool
    })
  ),
  autoPlayInterval: PropTypes.number,
  enableAutoPlay: PropTypes.bool,
  enableSwipe: PropTypes.bool
};

// Loading skeleton for BannerCarousel
export const BannerCarouselSkeleton = () => (
  <div className="w-full bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100">
    <div className="w-full px-4 max-w-7xl mx-auto py-16 md:py-20 lg:py-28">
      <div className="max-w-3xl space-y-6 animate-pulse">
        <div className="h-8 bg-gray-300 rounded-full w-48 mb-6"></div>
        <div className="h-16 bg-gray-300 rounded w-3/4 mb-4"></div>
        <div className="h-12 bg-gray-300 rounded w-2/3 mb-10"></div>
        <div className="h-14 bg-gray-300 rounded-xl w-48"></div>
      </div>
    </div>
  </div>
);

export default BannerCarousel;
