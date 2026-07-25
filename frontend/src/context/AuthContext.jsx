import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

// Request interceptor to automatically attach authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (token) {
        try {
          const res = await api.get('/users/profile');
          setUser(res.data);
        } catch (err) {
          console.error("Error loading user profile", err);
          logout();
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: jwt, name, role } = res.data;
    localStorage.setItem('token', jwt);
    setToken(jwt);
    setUser({ name, email, role });
    return { name, email, role };
  };

  const register = async (name, email, password, role = 'ROLE_CANDIDATE') => {
    await api.post('/auth/register', { name, email, password, role });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (name, password) => {
    const res = await api.put('/users/profile', { name, password });
    setUser(res.data);
    return res.data;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ROLE_ADMIN',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
