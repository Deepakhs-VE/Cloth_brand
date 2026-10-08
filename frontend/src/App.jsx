import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

// Providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { SettingsProvider } from './context/SettingsContext';
import { ApplicationAlertProvider } from './context/ApplicationAlertContext';

// Layout & Guards
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/layout/CartDrawer';
import { FloatingWhatsApp } from './components/layout/FloatingWhatsApp';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AdminRoute } from './components/layout/AdminRoute';

const lazyNamed = (importer, exportName) =>
  lazy(() => importer().then((module) => ({ default: module[exportName] })));

// Route-level code splitting keeps the initial storefront bundle small.
const HomePage = lazyNamed(() => import('./pages/HomePage'), 'HomePage');
const ProductsPage = lazyNamed(() => import('./pages/ProductsPage'), 'ProductsPage');
const ProductDetailPage = lazyNamed(() => import('./pages/ProductDetailPage'), 'ProductDetailPage');
const OffersPage = lazyNamed(() => import('./pages/OffersPage'), 'OffersPage');
const AboutPage = lazyNamed(() => import('./pages/AboutPage'), 'AboutPage');
const ContactPage = lazyNamed(() => import('./pages/ContactPage'), 'ContactPage');
const PoliciesPage = lazyNamed(() => import('./pages/PoliciesPage'), 'PoliciesPage');
const LoginPage = lazyNamed(() => import('./pages/LoginPage'), 'LoginPage');
const RegisterPage = lazyNamed(() => import('./pages/RegisterPage'), 'RegisterPage');
const ForgotPasswordPage = lazyNamed(() => import('./pages/ForgotPasswordPage'), 'ForgotPasswordPage');
const ResetPasswordPage = lazyNamed(() => import('./pages/ResetPasswordPage'), 'ResetPasswordPage');
const CartPage = lazyNamed(() => import('./pages/CartPage'), 'CartPage');
const CheckoutPage = lazyNamed(() => import('./pages/CheckoutPage'), 'CheckoutPage');
const OrderSuccessPage = lazyNamed(() => import('./pages/OrderSuccessPage'), 'OrderSuccessPage');
const AccountDashboardPage = lazyNamed(() => import('./pages/AccountDashboardPage'), 'AccountDashboardPage');
const OrdersPage = lazyNamed(() => import('./pages/OrdersPage'), 'OrdersPage');
const OrderDetailPage = lazyNamed(() => import('./pages/OrderDetailPage'), 'OrderDetailPage');
const AddressesPage = lazyNamed(() => import('./pages/AddressesPage'), 'AddressesPage');
const WishlistPage = lazyNamed(() => import('./pages/WishlistPage'), 'WishlistPage');
const ProfilePage = lazyNamed(() => import('./pages/ProfilePage'), 'ProfilePage');
const AdminDashboardPage = lazyNamed(() => import('./pages/admin/AdminDashboardPage'), 'AdminDashboardPage');
const AdminProductsPage = lazyNamed(() => import('./pages/admin/AdminProductsPage'), 'AdminProductsPage');
const AdminCategoriesPage = lazyNamed(() => import('./pages/admin/AdminCategoriesPage'), 'AdminCategoriesPage');
const AdminOrdersPage = lazyNamed(() => import('./pages/admin/AdminOrdersPage'), 'AdminOrdersPage');
const AdminUsersPage = lazyNamed(() => import('./pages/admin/AdminUsersPage'), 'AdminUsersPage');
const AdminCouponsPage = lazyNamed(() => import('./pages/admin/AdminCouponsPage'), 'AdminCouponsPage');
const AdminReviewsPage = lazyNamed(() => import('./pages/admin/AdminReviewsPage'), 'AdminReviewsPage');
const AdminTestimonialsPage = lazyNamed(() => import('./pages/admin/AdminTestimonialsPage'), 'AdminTestimonialsPage');
const AdminMessagesPage = lazyNamed(() => import('./pages/admin/AdminMessagesPage'), 'AdminMessagesPage');
const AdminSettingsPage = lazyNamed(() => import('./pages/admin/AdminSettingsPage'), 'AdminSettingsPage');

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.querySelectorAll('[data-scroll-container]').forEach((container) => {
      container.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
  }, [pathname]);

  return null;
}

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      {!isAdminRoute && <Navbar />}
      <CartDrawer />
      {!isAdminRoute && <FloatingWhatsApp />}

      <main className="flex-1">
        <div key={location.pathname} className="route-transition">
          <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /></div>}>
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/offers" element={<OffersPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/policies" element={<PoliciesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Customer Routes */}
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-success/:id"
            element={
              <ProtectedRoute>
                <OrderSuccessPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/orders"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/addresses"
            element={
              <ProtectedRoute>
                <AddressesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/wishlist"
            element={
              <ProtectedRoute>
                <WishlistPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <AdminRoute>
                <AdminProductsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <AdminRoute>
                <AdminCategoriesPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <AdminRoute>
                <AdminOrdersPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsersPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/coupons"
            element={
              <AdminRoute>
                <AdminCouponsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/reviews"
            element={
              <AdminRoute>
                <AdminReviewsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/testimonials"
            element={
              <AdminRoute>
                <AdminTestimonialsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/messages"
            element={
              <AdminRoute>
                <AdminMessagesPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <AdminRoute>
                <AdminSettingsPage />
              </AdminRoute>
            }
          />

          {/* 404 Fallback */}
          <Route
            path="*"
            element={
              <div className="py-28 text-center bg-[#fcfbfa]">
                <h1 className="font-luxury text-4xl font-extrabold text-slate-900 mb-2">404</h1>
                <p className="text-sm text-slate-500 mb-6">The requested page does not exist.</p>
                <a
                  href="/"
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs uppercase tracking-wider font-bold"
                >
                  Return Home
                </a>
              </div>
            }
          />
          </Routes>
          </Suspense>
        </div>
      </main>

      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ApplicationAlertProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <SettingsProvider>
              <AppContent />
            </SettingsProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ApplicationAlertProvider>
  );
}
