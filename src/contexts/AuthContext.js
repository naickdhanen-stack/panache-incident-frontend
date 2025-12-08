// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
// ✅ Import your configured axios instance (with baseURL + interceptors)
import api from '../utils/api';
import { API_URL } from '../utils/config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        // ✅ No need to manually set header — api.js interceptor does it
      } catch (e) {
        console.error('Invalid user data in localStorage');
        logout();
      }
    }

    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      // ✅ FIXED: Use '/api/auth/login' to match backend route
      const response = await api.post('/api/auth/login', {
        username,
        password
      });

      const { token: receivedToken, user: receivedUser } = response.data;

      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);

      return { success: true };
    } catch (error) {
      console.error('Login error details:', {
        status: error.response?.status,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        data: error.response?.data
      });
      return {
        success: false,
        error: error.response?.data?.error || 'Invalid username or password'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    // ✅ Interceptor auto-removes header on next request — no need to delete manually
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        loading,
        isAuthenticated: !!token,
        isAdmin: user?.role === 'admin',
        isSuperuser: user?.role === 'superuser',
        isUser: user?.role === 'user',
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};