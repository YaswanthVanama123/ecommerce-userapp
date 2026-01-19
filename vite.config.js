import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

// https://vite.dev/config/
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.js',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.test.{js,jsx}',
        '**/dist/**',
      ],
    },
  },
  plugins: [
    react(),
    // Bundle size visualization - generates stats.html
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // 'sunburst', 'treemap', 'network'
    }),
    // Gzip compression
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240, // Only compress files larger than 10kb
      algorithm: 'gzip',
      ext: '.gz',
      deleteOriginFile: false,
    }),
    // Brotli compression (better compression than gzip)
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'brotliCompress',
      ext: '.br',
      deleteOriginFile: false,
    }),
  ],
  server: {
    port: 5173,
    host: 'localhost', // Use localhost instead of ::1 to avoid IPv6 issues
    strictPort: false, // Try next port if 5173 is busy
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    // Output directory
    outDir: 'dist',
    // Copy service worker to dist without processing
    copyPublicDir: true,
    // Generate sourcemaps for production (set to false for smaller builds)
    sourcemap: false,
    // Enable minification
    minify: 'terser',
    // Terser minification options
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true, // Remove debugger statements
        pure_funcs: ['console.log', 'console.info'], // Remove specific console methods
        passes: 2, // Run minifier twice for better compression
      },
      format: {
        comments: false, // Remove all comments
      },
      mangle: {
        safari10: true, // Fix Safari 10+ issues
      },
    },
    // Chunk size warning limit (in kbs)
    chunkSizeWarningLimit: 1000,
    // CSS code splitting
    cssCodeSplit: true,
    // Improve build performance
    reportCompressedSize: true,
    // Rollup options for optimal chunking
    rollupOptions: {
      output: {
        // Manual chunk splitting strategy
        manualChunks: (id) => {
          // React core libraries
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'react-vendor';
          }

          // React Router
          if (id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/react-router/') ||
              id.includes('node_modules/@remix-run/')) {
            return 'router';
          }

          // Form handling
          if (id.includes('node_modules/react-hook-form/')) {
            return 'forms';
          }

          // HTTP client
          if (id.includes('node_modules/axios/')) {
            return 'http';
          }

          // UI/Toast notifications
          if (id.includes('node_modules/react-toastify/')) {
            return 'ui-libs';
          }

          // Lazy-loaded page components - keep them as separate chunks
          if (id.includes('/pages/Home.')) {
            return 'page-home';
          }
          if (id.includes('/pages/Login.')) {
            return 'page-login';
          }
          if (id.includes('/pages/Register.')) {
            return 'page-register';
          }
          if (id.includes('/pages/ProductListing.')) {
            return 'page-product-listing';
          }
          if (id.includes('/pages/ProductDetail.')) {
            return 'page-product-detail';
          }
          if (id.includes('/pages/Cart.')) {
            return 'page-cart';
          }
          if (id.includes('/pages/Checkout.')) {
            return 'page-checkout';
          }
          if (id.includes('/pages/OrderHistory.')) {
            return 'page-order-history';
          }
          if (id.includes('/pages/Profile.')) {
            return 'page-profile';
          }

          // Other node_modules dependencies
          if (id.includes('node_modules/')) {
            return 'vendor-other';
          }
        },
        // Output file naming patterns
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: (chunkInfo) => {
          // Create separate folder structure for different chunk types
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : '';

          // Vendor chunks
          if (chunkInfo.name.includes('vendor') || chunkInfo.name.includes('react') ||
              chunkInfo.name.includes('router') || chunkInfo.name.includes('forms') ||
              chunkInfo.name.includes('http') || chunkInfo.name.includes('ui-libs')) {
            return 'assets/js/vendor/[name]-[hash].js';
          }

          // Page chunks (lazy loaded routes)
          if (facadeModuleId.includes('pages') || facadeModuleId.includes('Page')) {
            return 'assets/js/pages/[name]-[hash].js';
          }

          // Component chunks
          if (facadeModuleId.includes('components') || facadeModuleId.includes('Component')) {
            return 'assets/js/components/[name]-[hash].js';
          }

          // Default chunks
          return 'assets/js/[name]-[hash].js';
        },
        assetFileNames: (assetInfo) => {
          // Organize assets by type
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];

          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          if (ext === 'css') {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        // Optimize chunk loading
        compact: true,
        // Preserve module structure for better caching
        preserveModules: false,
        // Hoist transitive imports for better tree-shaking
        hoistTransitiveImports: true,
        // Set proper global name for UMD builds (if needed)
        generatedCode: {
          constBindings: true,
          objectShorthand: true,
        },
      },
      // Tree-shaking optimizations
      treeshake: {
        moduleSideEffects: 'no-external', // Assume external modules have no side effects
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
    },
    // Asset handling
    assetsInlineLimit: 4096, // Files smaller than 4kb will be inlined as base64
  },
  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'react-hook-form',
      'react-toastify',
    ],
    exclude: [],
    // Enable esbuild optimizations
    esbuildOptions: {
      // Tree-shaking unused imports
      treeShaking: true,
      // Target modern browsers for better optimization
      target: 'esnext',
      // Enable minification in dependencies
      minify: true,
    },
  },
  // Enable esbuild for better performance
  esbuild: {
    // Remove console and debugger in production
    drop: ['console', 'debugger'],
    // Legal comments handling
    legalComments: 'none',
    // Minify identifiers
    minifyIdentifiers: true,
    // Minify syntax
    minifySyntax: true,
    // Minify whitespace
    minifyWhitespace: true,
    // Target modern browsers
    target: 'esnext',
  },
  // Define global constants (useful for environment-based optimizations)
  define: {
    __DEV__: JSON.stringify(false),
    __PROD__: JSON.stringify(true),
  },
  // CSS handling
  css: {
    // PostCSS configuration - explicitly load Tailwind
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },
})
