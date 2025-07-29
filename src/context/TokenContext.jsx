import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const TokenContext = createContext();

export const useToken = () => {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error('useToken must be used within a TokenProvider');
  }
  return context;
};

export const TokenProvider = ({ children }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [dailyEarnings, setDailyEarnings] = useState(0);

  // Mock transaction data
  const mockTransactions = [
    {
      id: '1',
      type: 'earned',
      amount: 25,
      timestamp: new Date().toISOString(),
      description: 'Daily login bonus'
    },
    {
      id: '2',
      type: 'earned',
      amount: 15,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      description: 'Content interaction'
    },
    {
      id: '3',
      type: 'spent',
      amount: -10,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      description: 'Premium content unlock'
    }
  ];

  useEffect(() => {
    if (user) {
      setTransactions(mockTransactions);
      setDailyEarnings(25);
    }
  }, [user]);

  const earnTokens = (amount, description) => {
    if (!user) return;

    const newTransaction = {
      id: Date.now().toString(),
      type: 'earned',
      amount,
      timestamp: new Date().toISOString(),
      description
    };

    setTransactions(prev => [newTransaction, ...prev]);
    setDailyEarnings(prev => prev + amount);
  };

  const spendTokens = (amount, description) => {
    if (!user) return false;
    if (user.phyghtTokenBalance < amount) return false;

    const newTransaction = {
      id: Date.now().toString(),
      type: 'spent',
      amount: -amount,
      timestamp: new Date().toISOString(),
      description
    };

    setTransactions(prev => [newTransaction, ...prev]);
    return true;
  };

  const getTokenBalance = () => {
    return user?.phyghtTokenBalance || 0;
  };

  const value = {
    transactions,
    dailyEarnings,
    earnTokens,
    spendTokens,
    getTokenBalance
  };

  return (
    <TokenContext.Provider value={value}>
      {children}
    </TokenContext.Provider>
  );
};