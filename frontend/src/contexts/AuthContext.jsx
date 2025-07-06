import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI, handleApiError } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        // Verify token is still valid
        verifyAuth();
      } catch (error) {
        console.error('Error parsing user data:', error);
        logout();
      }
    } else {
      // No stored credentials - user needs to login manually
      setIsLoading(false);
    }
  }, []);



  const verifyAuth = async () => {
    try {
      const response = await authAPI.profile();
      const userWithApiKey = {
        ...response.data.user,
        apiKey: response.data.apiKey
      };
      setUser(userWithApiKey);
      localStorage.setItem('user', JSON.stringify(userWithApiKey));
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token } = response.data;

      localStorage.setItem('token', token);
      
      // Fetch full user profile including apiKey
      const profileResponse = await authAPI.profile();
      const userWithApiKey = {
        ...profileResponse.data.user,
        apiKey: profileResponse.data.apiKey
      };
      
      localStorage.setItem('user', JSON.stringify(userWithApiKey));
      setUser(userWithApiKey);
      setIsAuthenticated(true);
      
      console.log('Login successful!');
      return { success: true };
    } catch (error) {
      const message = handleApiError(error);
      console.error('Login failed:', message);
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token } = response.data;

      localStorage.setItem('token', token);
      
      // Fetch full user profile including apiKey
      const profileResponse = await authAPI.profile();
      const userWithApiKey = {
        ...profileResponse.data.user,
        apiKey: profileResponse.data.apiKey
      };
      
      localStorage.setItem('user', JSON.stringify(userWithApiKey));
      setUser(userWithApiKey);
      setIsAuthenticated(true);
      
      console.log('Registration successful!');
      return { success: true };
    } catch (error) {
      const message = handleApiError(error);
      console.error('Registration failed:', message);
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    console.log('You have been logged out');
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.profile();
      const updatedUser = {
        ...response.data.user,
        apiKey: response.data.apiKey
      };
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      console.log('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      const message = handleApiError(error);
      console.error('Profile update failed:', message);
      return { success: false, message };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      await authAPI.changePassword(passwordData);
      console.log('Password changed successfully!');
      return { success: true };
    } catch (error) {
      const message = handleApiError(error);
      console.error('Password change failed:', message);
      return { success: false, message };
    }
  };

  const regenerateApiKey = async () => {
    try {
      const response = await authAPI.regenerateApiKey();
      const { apiKey } = response.data;
      
      const updatedUser = { ...user, apiKey };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      console.log('API key regenerated successfully!');
      return { success: true, apiKey };
    } catch (error) {
      const message = handleApiError(error);
      console.error('API key regeneration failed:', message);
      return { success: false, message };
    }
  };

  const deleteAccount = async () => {
    try {
      await authAPI.deleteAccount();
      logout();
      console.log('Account deleted successfully');
      return { success: true };
    } catch (error) {
      const message = handleApiError(error);
      console.error('Account deletion failed:', message);
      return { success: false, message };
    }
  };

  const value = {
    user,
    setUser,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    regenerateApiKey,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 