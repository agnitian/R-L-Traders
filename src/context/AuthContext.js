import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { fetchMe, logout as apiLogout, loginAdmin, loginWithPin } from '../api/auth';
import { tokenStorage } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, if a token exists, hydrate the current user
  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) {
      setLoading(false);
      return;
    }
    fetchMe()
      .then(setUser)
      .catch(() => {
        apiLogout();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signInAdmin = useCallback(async (creds) => {
    const u = await loginAdmin(creds);
    setUser(u);
    return u;
  }, []);

  const signInWithPin = useCallback(async (creds) => {
    const u = await loginWithPin(creds);
    setUser(u);
    return u;
  }, []);

  const signOut = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, signInAdmin, signInWithPin, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
