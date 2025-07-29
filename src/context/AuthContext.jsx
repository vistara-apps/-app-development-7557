import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('phyght_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // Simulate API call
    const userData = {
      id: '1',
      username: 'user123',
      email: email,
      subscriptionStatus: 'free',
      phyghtTokenBalance: 150
    };
    
    setUser(userData);
    localStorage.setItem('phyght_user', JSON.stringify(userData));
    return userData;
  };

  const register = async (username, email, password) => {
    // Simulate API call
    const userData = {
      id: Date.now().toString(),
      username: username,
      email: email,
      subscriptionStatus: 'free',
      phyghtTokenBalance: 50 // Welcome bonus
    };
    
    setUser(userData);
    localStorage.setItem('phyght_user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('phyght_user');
  };

  const updateSubscription = (status) => {
    const updatedUser = { ...user, subscriptionStatus: status };
    setUser(updatedUser);
    localStorage.setItem('phyght_user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateSubscription,
    isAuthenticated: !!user,
    isPremium: user?.subscriptionStatus === 'premium'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}