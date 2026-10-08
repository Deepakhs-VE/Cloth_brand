import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import authStorage from '../utils/authStorage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authStorage.getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = authStorage.getAccessToken();
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            authStorage.setUser(res.data.user);
          }
        } catch (error) {
          console.error('Session validation error:', error.message);
          authStorage.clearSession();
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      authStorage.setSession(res.data);
      setUser(res.data.user);
      return res.data;
    }
  };

  const register = async (name, email, password, confirmPassword, phone) => {
    const res = await api.post('/auth/register', { name, email, password, confirmPassword, phone });
    if (res.data.success) {
      authStorage.setSession(res.data);
      setUser(res.data.user);
      return res.data;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      authStorage.clearSession();
      setUser(null);
    }
  };

  const updateUserProfile = (updatedFields) => {
    const newUser = { ...user, ...updatedFields };
    setUser(newUser);
    authStorage.setUser(newUser);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    loading,
    login,
    register,
    logout,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
