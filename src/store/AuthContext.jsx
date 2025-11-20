import { createContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoading: true,
  login: (token, user) => {},
  signup: (token, user) => {},
  logout: () => {}
});

const AUTH_STORAGE_KEY = 'food-order-auth';

export function AuthContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const login = useCallback((token, userData) => {
    setToken(token);
    setUser(userData);

    const authData = {
      token,
      user: userData,
      timestamp: new Date().getTime()
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
  }, []);

  const signup = useCallback((token, userData) => {
    login(token, userData);
  }, [login]);

  const verifyToken = useCallback(async (storedToken) => {
    try {
      const response = await fetch('http://localhost:3000/auth/verify', {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Token verification failed');
      }

      const data = await response.json();
      setToken(storedToken);
      setUser(data.user);
      console.log(data.user)
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    const loadAuthFromStorage = () => {
      try {
        const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!savedAuth) {
          setIsLoading(false);
          return;
        }

        const { token: storedToken, user: storedUser, timestamp } = JSON.parse(savedAuth);

        const TOKEN_EXPIRY = 24 * 60 * 60 * 1000;
        const now = new Date().getTime();

        if (now - timestamp > TOKEN_EXPIRY) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          setIsLoading(false);
          return;
        }

        verifyToken(storedToken);
      } catch (error) {
        console.error('Error loading auth from localStorage:', error);
        setIsLoading(false);
      }
    };

    loadAuthFromStorage();
  }, [verifyToken]);
  debugger
  const contextValue = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.isAdmin || false,
    isLoading,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
