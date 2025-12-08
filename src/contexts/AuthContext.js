// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
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

  // ✅ Define logout with useCallback so it can be used in useEffect
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch (e) {
        console.error('Invalid user data in localStorage');
        logout();
      }
    }

    setLoading(false);
  }, [logout]); // ✅ Added logout to dependency array

  const login = async (username, password) => {
    try {
      console.log('🔐 Attempting login...');
      console.log('API URL:', API_URL);
      
      const response = await api.post('/api/auth/login', {
        username,
        password
      });

      console.log('✅ Login response:', response.data);

      const { token: receivedToken, user: receivedUser } = response.data;

      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);

      return { success: true };
    } catch (error) {
      console.error('❌ Login error details:', {
        status: error.response?.status,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        data: error.response?.data,
        message: error.message
      });
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Invalid username or password'
      };
    }
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