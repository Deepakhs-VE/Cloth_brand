import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const SettingsContext = createContext(null);
const SETTINGS_SYNC_KEY = 'aura_settings_updated_at';

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get('/settings', { params: { fresh: Date.now() } });
      if (res.data.success && res.data.settings) {
        setSettings(res.data.settings);
        return res.data.settings;
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  const syncSettings = useCallback((nextSettings) => {
    if (nextSettings) setSettings(nextSettings);
    try {
      window.localStorage.setItem(SETTINGS_SYNC_KEY, String(Date.now()));
    } catch {
      // Current-tab updates still work if browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === SETTINGS_SYNC_KEY) fetchSettings();
    };
    const handleFocus = () => fetchSettings();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchSettings();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchSettings]);

  const value = {
    settings,
    loading,
    refreshSettings: fetchSettings,
    syncSettings,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
