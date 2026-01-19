import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

/**
 * MetaTags Component
 * Comprehensive SEO meta tags component with Open Graph, Twitter Card, and JSON-LD support
 */
const MetaTags = ({
  title,
  description,
  keywords,
  canonicalUrl,
  ogType = 'website',
  ogImage,
  ogImageAlt,
  twitterCard = 'summary_large_image',
  twitterSite,
  twitterCreator,
  structuredData,
  noindex = false,
  nofollow = false,
  author,
  publishedTime,
  modifiedTime,
  section,
  tags,
  locale = 'en_US',
  siteName = 'StyleHub'
}) => {
  // Site base URL from environment
  const baseUrl = import.meta.env.VITE_APP_URL || 'https://stylehub.com';

  // Build full canonical URL
  const fullCanonicalUrl = canonicalUrl?.startsWith('http')
    ? canonicalUrl
    : `${baseUrl}${canonicalUrl || ''}`;

  // Build full OG image URL
  const fullOgImage = ogImage?.startsWith('http')
    ? ogImage
    : ogImage
    ? `${baseUrl}${ogImage}`
    : `${baseUrl}/images/og-default.jpg`;

  // Build robots content
  const robotsContent = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow'
  ].join(', ');

  // Build full title with site name
  const fullTitle = title ? `${title} | ${siteName}` : siteName;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      {author && <meta name="author" content={author} />}

      {/* Robots */}
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />

      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={fullCanonicalUrl} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:title" content={title || siteName} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:image" content={fullOgImage} />
      {ogImageAlt && <meta property="og:image:alt" content={ogImageAlt} />}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />

      {/* Article specific OG tags */}
      {ogType === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {ogType === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {ogType === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
      {ogType === 'article' && section && (
        <meta property="article:section" content={section} />
      )}
      {ogType === 'article' && tags && tags.length > 0 &&
        tags.map((tag, index) => (
          <meta key={index} property="article:tag" content={tag} />
        ))
      }

      {/* Twitter */}
      <meta property="twitter:card" content={twitterCard} />
      <meta property="twitter:url" content={fullCanonicalUrl} />
      <meta property="twitter:title" content={title || siteName} />
      {description && <meta property="twitter:description" content={description} />}
      <meta property="twitter:image" content={fullOgImage} />
      {ogImageAlt && <meta property="twitter:image:alt" content={ogImageAlt} />}
      {twitterSite && <meta property="twitter:site" content={twitterSite} />}
      {twitterCreator && <meta property="twitter:creator" content={twitterCreator} />}

      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}

      {/* Additional SEO enhancements */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="theme-color" content="#000000" />

      {/* Mobile optimization */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content={siteName} />
    </Helmet>
  );
};

MetaTags.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  keywords: PropTypes.string,
  canonicalUrl: PropTypes.string,
  ogType: PropTypes.oneOf(['website', 'article', 'product', 'profile']),
  ogImage: PropTypes.string,
  ogImageAlt: PropTypes.string,
  twitterCard: PropTypes.oneOf(['summary', 'summary_large_image', 'app', 'player']),
  twitterSite: PropTypes.string,
  twitterCreator: PropTypes.string,
  structuredData: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  noindex: PropTypes.bool,
  nofollow: PropTypes.bool,
  author: PropTypes.string,
  publishedTime: PropTypes.string,
  modifiedTime: PropTypes.string,
  section: PropTypes.string,
  tags: PropTypes.arrayOf(PropTypes.string),
  locale: PropTypes.string,
  siteName: PropTypes.string
};

export default MetaTags;
