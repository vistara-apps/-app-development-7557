import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

const TokenContext = createContext();

export function useTokens() {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error('useTokens must be used within a TokenProvider');
  }
  return context;
}

export function TokenProvider({ children }) {
  const { user, setUser } = useAuth();
  const [transactions, setTransactions] = useState([
    {
      id: '1',
      type: 'earned',
      amount: 50,
      timestamp: new Date().toISOString(),
      description: 'Welcome bonus'
    }
  ]);

  const earnTokens = (amount, description) => {
    const transaction = {
      id: Date.now().toString(),
      type: 'earned',
      amount: amount,
      timestamp: new Date().toISOString(),
      description: description
    };

    setTransactions(prev => [transaction, ...prev]);
    
    if (user) {
      const updatedUser = {
        ...user,
        phyghtTokenBalance: user.phyghtTokenBalance + amount
      };
      localStorage.setItem('phyght_user', JSON.stringify(updatedUser));
      // Note: In real implementation, would update via AuthContext
    }
  };

  const spendTokens = (amount, description) => {
    if (!user || user.phyghtTokenBalance < amount) {
      throw new Error('Insufficient tokens');
    }

    const transaction = {
      id: Date.now().toString(),
      type: 'spent',
      amount: amount,
      timestamp: new Date().toISOString(),
      description: description
    };

    setTransactions(prev => [transaction, ...prev]);
    
    const updatedUser = {
      ...user,
      phyghtTokenBalance: user.phyghtTokenBalance - amount
    };
    localStorage.setItem('phyght_user', JSON.stringify(updatedUser));
  };

  const value = {
    transactions,
    earnTokens,
    spendTokens,
    balance: user?.phyghtTokenBalance || 0
  };

  return (
    <TokenContext.Provider value={value}>
      {children}
    </TokenContext.Provider>
  );
}