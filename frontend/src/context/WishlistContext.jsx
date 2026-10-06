import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { fetchCart, setCartDrawerOpen } = useCart();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = async () => {
    if (!isAuthenticated) {
      setWishlist([]);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get('/wishlist');
      if (res.data.success) {
        setWishlist(res.data.wishlist);
      }
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [isAuthenticated]);

  const isInWishlist = (productId) => {
    return wishlist.some((item) => item._id === productId);
  };

  const toggleWishlist = async (productId) => {
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    try {
      const res = await api.post('/wishlist/toggle', { productId });
      if (res.data.success) {
        setWishlist(res.data.wishlist);
        return { success: true, isWishlisted: res.data.isWishlisted, message: res.data.message };
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error updating wishlist' };
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      await api.delete(`/wishlist/${productId}`);
      setWishlist((prev) => prev.filter((item) => item._id !== productId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const moveToCart = async (productId) => {
    try {
      const res = await api.post('/wishlist/move-to-cart', { productId });
      if (res.data.success) {
        setWishlist((prev) => prev.filter((item) => item._id !== productId));
        await fetchCart();
        setCartDrawerOpen(true);
        return { success: true };
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error moving to cart' };
    }
  };

  const value = {
    wishlist,
    loading,
    isInWishlist,
    toggleWishlist,
    removeFromWishlist,
    moveToCart,
    fetchWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
