const ACCESS_TOKEN_KEY = 'aura_access_token';
const REFRESH_TOKEN_KEY = 'aura_refresh_token';
const USER_KEY = 'aura_user';
const AUTH_KEYS = [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY];

const getSessionStorage = () =>
  typeof window !== 'undefined' ? window.sessionStorage : null;

const removeLegacySharedSession = () => {
  if (typeof window === 'undefined') return;

  // localStorage is shared by every tab. Keeping authentication there allows a
  // customer login in one tab to replace an admin login in another tab.
  AUTH_KEYS.forEach((key) => window.localStorage.removeItem(key));
};

removeLegacySharedSession();

const authStorage = {
  getAccessToken() {
    return getSessionStorage()?.getItem(ACCESS_TOKEN_KEY) || null;
  },

  getRefreshToken() {
    return getSessionStorage()?.getItem(REFRESH_TOKEN_KEY) || null;
  },

  getUser() {
    const storage = getSessionStorage();
    const savedUser = storage?.getItem(USER_KEY);
    if (!savedUser) return null;

    try {
      return JSON.parse(savedUser);
    } catch {
      storage.removeItem(USER_KEY);
      return null;
    }
  },

  setSession({ accessToken, refreshToken, user }) {
    const storage = getSessionStorage();
    if (!storage) return;

    storage.setItem(ACCESS_TOKEN_KEY, accessToken);
    storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    storage.setItem(USER_KEY, JSON.stringify(user));
  },

  setAccessToken(accessToken) {
    getSessionStorage()?.setItem(ACCESS_TOKEN_KEY, accessToken);
  },

  setUser(user) {
    getSessionStorage()?.setItem(USER_KEY, JSON.stringify(user));
  },

  clearSession() {
    const storage = getSessionStorage();
    AUTH_KEYS.forEach((key) => storage?.removeItem(key));
  },
};

export default authStorage;
