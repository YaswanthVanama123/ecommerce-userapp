import React from 'react';

/**
 * Loading Component - Optimized loading states
 */
const Loading = ({ message = 'Loading...', fullscreen = false, size = 'medium' }) => {
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-12 w-12',
    large: 'h-16 w-16',
  };

  const containerClasses = fullscreen
    ? 'fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50'
    : 'flex items-center justify-center min-h-[400px]';

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div
          className={`inline-block animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}
          role="status"
          aria-label="Loading"
        ></div>
        {message && <p className="mt-4 text-gray-600">{message}</p>}
      </div>
    </div>
  );
};

/**
 * Skeleton Loader Component - Better perceived performance
 */
export const SkeletonLoader = ({ width = '100%', height = '20px', className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      style={{ width, height }}
      role="status"
      aria-label="Loading content"
    />
  );
};

/**
 * Card Skeleton Loader
 */
export const CardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <SkeletonLoader height="200px" />
      <SkeletonLoader width="60%" />
      <SkeletonLoader width="80%" />
      <div className="flex gap-2">
        <SkeletonLoader width="30%" height="32px" />
        <SkeletonLoader width="30%" height="32px" />
      </div>
    </div>
  );
};

/**
 * List Skeleton Loader
 */
export const ListSkeleton = ({ items = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex gap-4 p-4 bg-white rounded-lg shadow">
          <SkeletonLoader width="80px" height="80px" className="flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonLoader width="70%" />
            <SkeletonLoader width="90%" />
            <SkeletonLoader width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Spinner Component - Inline spinner for buttons
 */
export const Spinner = ({ size = 'small', color = 'white' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-6 w-6',
    large: 'h-8 w-8',
  };

  const colorClasses = {
    white: 'border-white',
    blue: 'border-blue-600',
    gray: 'border-gray-600',
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-2 border-t-transparent ${sizeClasses[size]} ${colorClasses[color]}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

/**
 * Progress Bar Component
 */
export const ProgressBar = ({ progress = 0, className = '' }) => {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin="0"
        aria-valuemax="100"
      />
    </div>
  );
};

/**
 * LoadingBoundary - Suspense-like boundary for loading states
 */
export const LoadingBoundary = ({ loading, fallback, children, error, errorFallback }) => {
  if (error) {
    if (errorFallback) {
      return errorFallback;
    }
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-700">An error occurred while loading content.</p>
      </div>
    );
  }

  if (loading) {
    return fallback || <Loading />;
  }

  return children;
};

export default Loading;
