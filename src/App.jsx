import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Performance monitoring
import { initPerformanceMonitoring } from './utils/performance';
import { initRoutePrefetching, setupResourceHints } from './utils/routePrefetch';

// Components that should load immediately (critical for app shell)
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import PrivateRoute from './routes/PrivateRoute';
import Loading from './components/common/Loading';
import ErrorBoundary from './components/common/ErrorBoundary';

// Lazy-loaded page components with optimized chunk names
const Home = lazy(() =>
  import(/* webpackChunkName: "page-home" */ './pages/Home')
);
const Login = lazy(() =>
  import(/* webpackChunkName: "page-login" */ './pages/Login')
);
const Register = lazy(() =>
  import(/* webpackChunkName: "page-register" */ './pages/Register')
);
const ForgotPassword = lazy(() =>
  import(/* webpackChunkName: "page-forgot-password" */ './pages/ForgotPassword')
);
const ProductListing = lazy(() =>
  import(/* webpackChunkName: "page-product-listing" */ './pages/ProductListing')
);
const ProductDetail = lazy(() =>
  import(/* webpackChunkName: "page-product-detail" */ './pages/ProductDetail')
);
const Cart = lazy(() =>
  import(/* webpackChunkName: "page-cart" */ './pages/Cart')
);
const Checkout = lazy(() =>
  import(/* webpackChunkName: "page-checkout" */ './pages/Checkout')
);
const OrderHistory = lazy(() =>
  import(/* webpackChunkName: "page-order-history" */ './pages/OrderHistory')
);
const Profile = lazy(() =>
  import(/* webpackChunkName: "page-profile" */ './pages/Profile')
);

function AppContent() {
  useEffect(() => {
    // Initialize performance monitoring
    if (import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true') {
      initPerformanceMonitoring();
    }

    // Setup resource hints and prefetching
    if (import.meta.env.VITE_ENABLE_LAZY_LOADING === 'true') {
      setupResourceHints();
      initRoutePrefetching();
    }

    // Log app initialization
    console.log(`${import.meta.env.VITE_APP_NAME || 'App'} initialized in ${import.meta.env.MODE} mode`);
  }, []);

  return (
    <div className="w-full min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="w-full flex-grow">
        <ErrorBoundary>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/products" element={<ProductListing />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route
                path="/cart"
                element={
                  <PrivateRoute>
                    <Cart />
                  </PrivateRoute>
                }
              />
              <Route
                path="/checkout"
                element={
                  <PrivateRoute>
                    <Checkout />
                  </PrivateRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <PrivateRoute>
                    <OrderHistory />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <AppContent />
            <ToastContainer position="top-right" autoClose={3000} />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
