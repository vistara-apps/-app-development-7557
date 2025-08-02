import React, { createContext, useContext, useState, useEffect } from 'react';

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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [loading, setLoading] = useState(true);

  // Mock user data for demo
  const mockUser = {
    id: '1',
    username: 'demo_user',
    email: 'demo@phyght.com',
    subscriptionStatus: 'free', // 'free', 'premium'
    phyghtTokenBalance: 150,
    profilePicture: null,
    joinDate: '2024-01-01',
    preferences: ['action', 'thriller', 'sci-fi']
  };

  useEffect(() => {
    // Simulate loading user data
    const timer = setTimeout(() => {
      try {
        const savedUser = localStorage.getItem('phyght_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const login = async (email, password) => {
    try {
      // Mock login - in real app, call API
      if (email && password) {
        setUser(mockUser);
        localStorage.setItem('phyght_user', JSON.stringify(mockUser));
        setIsAuthModalOpen(false);
        return { success: true };
      }
      throw new Error('Invalid credentials');
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (username, email, password) => {
    try {
      // Mock registration
      if (username && email && password) {
        const newUser = { ...mockUser, username, email };
        setUser(newUser);
        localStorage.setItem('phyght_user', JSON.stringify(newUser));
        setIsAuthModalOpen(false);
        return { success: true };
      }
      throw new Error('Registration failed');
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('phyght_user');
  };

  const updateSubscription = (status) => {
    if (user) {
      const updatedUser = { ...user, subscriptionStatus: status };
      setUser(updatedUser);
      localStorage.setItem('phyght_user', JSON.stringify(updatedUser));
    }
  };

  const openAuthModal = (mode = 'login') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const value = {
    user,
    loading,
    isAuthModalOpen,
    authMode,
    login,
    register,
    logout,
    updateSubscription,
    openAuthModal,
    closeAuthModal,
    setAuthMode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};