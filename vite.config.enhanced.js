import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [
      react({
        // Enable Fast Refresh
        fastRefresh: true,
        // Babel options for optimization
        babel: {
          plugins: [
            // Remove prop-types in production
            isProduction && ['babel-plugin-transform-react-remove-prop-types', { removeImport: true }]
          ].filter(Boolean)
        }
      }),

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
      host: 'localhost',
      strictPort: false,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true
        }
      },
      // Enable HMR
      hmr: {
        overlay: true
      }
    },

    build: {
      outDir: 'dist',
      copyPublicDir: true,
      sourcemap: false,
      minify: 'terser',

      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction,
          pure_funcs: isProduction ? ['console.log', 'console.info', 'console.debug'] : [],
          passes: 2,
          // Advanced compression options
          dead_code: true,
          conditionals: true,
          evaluate: true,
          booleans: true,
          loops: true,
          unused: true,
          hoist_funs: true,
          hoist_vars: false,
          if_return: true,
          join_vars: true,
          reduce_vars: true,
          collapse_vars: true,
        },
        format: {
          comments: false,
        },
        mangle: {
          safari10: true,
        },
      },

      chunkSizeWarningLimit: 1000,
      cssCodeSplit: true,
      reportCompressedSize: true,

      rollupOptions: {
        output: {
          // Advanced manual chunk splitting strategy
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

            // Date libraries
            if (id.includes('node_modules/date-fns/') || id.includes('node_modules/dayjs/')) {
              return 'date-utils';
            }

            // Lazy-loaded page components - keep them as separate chunks
            if (id.includes('/pages/Home.')) return 'page-home';
            if (id.includes('/pages/Login.')) return 'page-login';
            if (id.includes('/pages/Register.')) return 'page-register';
            if (id.includes('/pages/Products.')) return 'page-products';
            if (id.includes('/pages/ProductDetail.')) return 'page-product-detail';
            if (id.includes('/pages/Cart.')) return 'page-cart';
            if (id.includes('/pages/Wishlist.')) return 'page-wishlist';
            if (id.includes('/pages/Checkout.')) return 'page-checkout';
            if (id.includes('/pages/OrderHistory.')) return 'page-order-history';
            if (id.includes('/pages/OrderDetails.')) return 'page-order-details';
            if (id.includes('/pages/Profile.')) return 'page-profile';
            if (id.includes('/pages/TrackOrder.')) return 'page-track-order';
            if (id.includes('/pages/MyShipments.')) return 'page-my-shipments';
            if (id.includes('/pages/Notifications.')) return 'page-notifications';
            if (id.includes('/pages/Returns.')) return 'page-returns';

            // Context providers
            if (id.includes('/context/')) {
              return 'contexts';
            }

            // Other node_modules dependencies
            if (id.includes('node_modules/')) {
              return 'vendor-other';
            }
          },

          // Output file naming patterns
          entryFileNames: 'assets/js/[name]-[hash].js',
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : '';

            // Vendor chunks
            if (chunkInfo.name.includes('vendor') || chunkInfo.name.includes('react') ||
                chunkInfo.name.includes('router') || chunkInfo.name.includes('forms') ||
                chunkInfo.name.includes('http') || chunkInfo.name.includes('ui-libs') ||
                chunkInfo.name.includes('date-utils')) {
              return 'assets/js/vendor/[name]-[hash].js';
            }

            // Page chunks
            if (chunkInfo.name.startsWith('page-') || facadeModuleId.includes('pages')) {
              return 'assets/js/pages/[name]-[hash].js';
            }

            // Context chunks
            if (chunkInfo.name.includes('context') || facadeModuleId.includes('context')) {
              return 'assets/js/contexts/[name]-[hash].js';
            }

            // Component chunks
            if (facadeModuleId.includes('components')) {
              return 'assets/js/components/[name]-[hash].js';
            }

            return 'assets/js/[name]-[hash].js';
          },

          assetFileNames: (assetInfo) => {
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

          compact: true,
          preserveModules: false,
          hoistTransitiveImports: true,
          generatedCode: {
            constBindings: true,
            objectShorthand: true,
          },
        },

        // Tree-shaking optimizations
        treeshake: {
          moduleSideEffects: 'no-external',
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
        },
      },

      assetsInlineLimit: 4096, // 4kb
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
      esbuildOptions: {
        treeShaking: true,
        target: 'esnext',
        minify: isProduction,
        // Define globals to optimize out in production
        define: {
          'process.env.NODE_ENV': isProduction ? '"production"' : '"development"'
        }
      },
    },

    // Enable esbuild for better performance
    esbuild: {
      drop: isProduction ? ['console', 'debugger'] : [],
      legalComments: 'none',
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true,
      target: 'esnext',
    },

    // Define global constants
    define: {
      __DEV__: JSON.stringify(!isProduction),
      __PROD__: JSON.stringify(isProduction),
      // Remove debug code in production
      'process.env.NODE_ENV': JSON.stringify(mode)
    },

    // CSS handling
    css: {
      postcss: {
        plugins: [
          tailwindcss,
          autoprefixer,
        ],
      },
      // Enable CSS modules if needed
      modules: {
        localsConvention: 'camelCase',
        generateScopedName: isProduction
          ? '[hash:base64:8]'
          : '[name]__[local]__[hash:base64:5]'
      },
      // Minify CSS
      preprocessorOptions: {
        scss: {
          additionalData: `$env: ${mode};`
        }
      }
    },

    // Performance optimizations
    resolve: {
      alias: {
        '@': '/src',
        '@components': '/src/components',
        '@pages': '/src/pages',
        '@utils': '/src/utils',
        '@context': '/src/context',
        '@api': '/src/api',
      },
      // Reduce file system lookups
      extensions: ['.mjs', '.js', '.jsx', '.json']
    },

    // Preview server configuration
    preview: {
      port: 4173,
      strictPort: false,
      host: true
    },

    // Worker configuration
    worker: {
      format: 'es',
      rollupOptions: {
        output: {
          entryFileNames: 'assets/workers/[name]-[hash].js'
        }
      }
    }
  };
});
