import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({ items: [], itemCount: 0, subtotal: 0 });
  const [loading, setLoading] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const fetchCart = async () => {
    if (!isAuthenticated) {
      setCart({ items: [], itemCount: 0, subtotal: 0 });
      return;
    }
    try {
      setLoading(true);
      const res = await api.get('/cart');
      if (res.data.success && res.data.cart) {
        setCart(res.data.cart);
      }
    } catch (error) {
      console.error('Failed to load cart:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated]);

  const addToCart = async (productId, quantity = 1, selectedSize = 'M', selectedColor = '') => {
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    try {
      const res = await api.post('/cart/add', { productId, quantity, selectedSize, selectedColor });
      if (res.data.success) {
        setCart(res.data.cart);
        setCartDrawerOpen(true);
        return { success: true, message: res.data.message };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to add item to cart';
      return { success: false, message: msg };
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      const res = await api.put(`/cart/item/${itemId}`, { quantity });
      if (res.data.success) {
        setCart(res.data.cart);
        return { success: true };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update quantity';
      return { success: false, message: msg };
    }
  };

  const removeItem = async (itemId) => {
    try {
      const res = await api.delete(`/cart/item/${itemId}`);
      if (res.data.success) {
        setCart(res.data.cart);
        return { success: true };
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to remove item' };
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart/clear');
      setCart({ items: [], itemCount: 0, subtotal: 0 });
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const value = {
    cart,
    loading,
    cartDrawerOpen,
    setCartDrawerOpen,
    fetchCart,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
