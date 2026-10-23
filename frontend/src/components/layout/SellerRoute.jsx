import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export const SellerRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  const [approval, setApproval] = useState('loading');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'seller') return;
    let cancelled = false;
    setApproval('loading');
    api.get('/sellers/me').then(({ data }) => {
      if (!cancelled) setApproval(data.seller?.status === 'APPROVED' ? 'approved' : 'pending');
    }).catch((error) => {
      if (!cancelled) setApproval(error.response?.status === 404 ? 'pending' : 'error');
    });
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.id, user?.role, retry]);
  if (loading || (isAuthenticated && user?.role === 'seller' && approval === 'loading')) return <div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" /></div>;
  if (!isAuthenticated) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  if (user?.role !== 'seller') return <Navigate to="/seller" replace />;
  if (approval === 'pending') return <Navigate to="/seller" replace />;
  if (approval === 'error') return <div className="p-12 text-center"><p>Could not verify your seller account.</p><button onClick={() => setRetry((value) => value + 1)} className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-white">Try again</button></div>;
  return children;
};
