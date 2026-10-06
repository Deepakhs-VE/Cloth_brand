import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  Package,
  MapPin,
  LogOut,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useSettings } from '../../context/SettingsContext';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { cart, setCartDrawerOpen } = useCart();
  const { wishlist } = useWishlist();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBarOpen, setSearchBarOpen] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchBarOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Collection', path: '/products' },
    { name: 'Offers', path: '/offers', badge: 'Sale' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const brandName = settings?.brandName || 'AURA';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all">
      {/* 1. Announcement Bar */}
      {settings?.announcementBar?.isEnabled && (
        <div className="bg-slate-900 text-slate-100 text-[11px] uppercase tracking-widest py-2 px-4 text-center font-medium flex items-center justify-center space-x-2">
          <span>{settings.announcementBar.text}</span>
          {settings.announcementBar.link && (
            <Link
              to={settings.announcementBar.link}
              className="underline hover:text-amber-300 transition ml-2"
            >
              Shop Now
            </Link>
          )}
        </div>
      )}

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Mobile menu trigger */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-900 focus:outline-none"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Brand Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <span className="font-luxury text-2xl sm:text-3xl font-extrabold tracking-widest text-slate-900 uppercase">
                {brandName}
              </span>
              <span className="inline-block w-1.5 h-1.5 bg-amber-600 rounded-full mb-1 group-hover:scale-125 transition-transform" />
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-xs uppercase tracking-widest font-medium transition-colors relative py-1 ${
                    isActive
                      ? 'text-slate-950 font-bold'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  {link.name}
                  {link.badge && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-[9px] bg-amber-100 text-amber-800 rounded font-semibold tracking-normal">
                      {link.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            {/* Search Toggle */}
            <button
              onClick={() => setSearchBarOpen(!searchBarOpen)}
              className="p-2 text-slate-700 hover:text-slate-950 hover:bg-slate-50 rounded-full transition"
              aria-label="Search products"
            >
              <Search className="w-5 h-5 stroke-[1.75]" />
            </button>

            {/* Wishlist */}
            <Link
              to="/account/wishlist"
              className="p-2 text-slate-700 hover:text-slate-950 hover:bg-slate-50 rounded-full transition relative"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5 stroke-[1.75]" />
              {wishlist.length > 0 && (
                <span className="absolute 1 top-1 right-1 bg-amber-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Shopping Bag / Cart */}
            <button
              onClick={() => setCartDrawerOpen(true)}
              className="p-2 text-slate-700 hover:text-slate-950 hover:bg-slate-50 rounded-full transition relative"
              aria-label="Cart"
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.75]" />
              {cart.itemCount > 0 && (
                <span className="absolute top-1 right-1 bg-slate-900 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cart.itemCount}
                </span>
              )}
            </button>

            {/* User Account Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 py-1 px-2.5 rounded-full border border-slate-200 hover:border-slate-300 bg-white transition text-xs font-medium text-slate-800"
                >
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:inline-block max-w-[100px] truncate">{user?.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                        <p className="text-sm font-semibold text-slate-900 truncate">{user?.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded uppercase">
                          {user?.role}
                        </span>
                      </div>

                      {isAdmin && (
                        <div className="py-1 border-b border-slate-100">
                          <Link
                            to="/admin"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition"
                          >
                            <ShieldCheck className="w-4 h-4 mr-2" />
                            Admin Console
                          </Link>
                        </div>
                      )}

                      <div className="py-1">
                        <Link
                          to="/account"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                        >
                          <LayoutDashboard className="w-4 h-4 mr-2 text-slate-400" />
                          Dashboard
                        </Link>
                        <Link
                          to="/account/orders"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                        >
                          <Package className="w-4 h-4 mr-2 text-slate-400" />
                          My Orders
                        </Link>
                        <Link
                          to="/account/addresses"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                        >
                          <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                          Saved Addresses
                        </Link>
                      </div>

                      <div className="py-1 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            logout();
                            navigate('/');
                          }}
                          className="w-full flex items-center px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-700 hover:text-slate-950 transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Search Bar Dropdown */}
      {searchBarOpen && (
        <div className="border-t border-slate-100 bg-slate-50/80 p-4 transition animate-fade-in">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search bespoke watches, headphones, duffle bags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-11 pr-24 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent shadow-sm"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              <button
                type="submit"
                className="absolute right-2 top-2 px-4 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 pt-4 pb-6 space-y-4 animate-fade-in shadow-xl">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2 text-sm font-medium text-slate-800 hover:text-slate-950 border-b border-slate-50"
              >
                <span>{link.name}</span>
                {link.badge && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {!isAuthenticated && (
            <div className="pt-2 flex flex-col space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 border border-slate-200 text-slate-800 text-xs uppercase tracking-wider font-semibold rounded-lg hover:bg-slate-50"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 bg-slate-900 text-white text-xs uppercase tracking-wider font-semibold rounded-lg hover:bg-slate-800"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
