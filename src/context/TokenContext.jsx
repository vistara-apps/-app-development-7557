import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { ADMIN_CONFIG } from '../config/features';
import { useFeatureFlags } from '../hooks/useFeatureFlags';

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
  const { isFeatureEnabled, isAdmin } = useFeatureFlags();
  const [transactions, setTransactions] = useState([]);
  const [dailyEarnings, setDailyEarnings] = useState(0);
  const [tokenSupply, setTokenSupply] = useState(ADMIN_CONFIG.TOKEN_SUPPLY);
  const [ownerBalance, setOwnerBalance] = useState(ADMIN_CONFIG.TOKEN_SUPPLY);
  const [isTokensMinted, setIsTokensMinted] = useState(false);

  // Mock transaction data (only shown if not in stealth mode)
  const mockTransactions = [
    {
      id: '1',
      type: 'earned',
      amount: 25,
      timestamp: new Date().toISOString(),
      description: 'Video engagement bonus'
    },
    {
      id: '2',
      type: 'earned',
      amount: 15,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      description: 'Daily activity reward'
    },
    {
      id: '3',
      type: 'spent',
      amount: -10,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      description: 'Premium fight unlock'
    }
  ];

  useEffect(() => {
    // Initialize token system
    if (isFeatureEnabled('ENABLE_TOKEN_MINTING') && !isTokensMinted) {
      mintInitialTokens();
    }

    if (user && !isFeatureEnabled('STEALTH_MODE')) {
      setTransactions(mockTransactions);
      setDailyEarnings(25);
    }
  }, [user, isTokensMinted]); // Removed isFeatureEnabled from dependency array

  const mintInitialTokens = () => {
    // Simulate token minting - in production this would interact with blockchain
    
    setIsTokensMinted(true);
    setOwnerBalance(ADMIN_CONFIG.TOKEN_SUPPLY);
    
    // Store minting info in localStorage for persistence
    localStorage.setItem('phyght_tokens_minted', 'true');
    localStorage.setItem('phyght_owner_balance', ADMIN_CONFIG.TOKEN_SUPPLY.toString());
    localStorage.setItem('phyght_mint_timestamp', new Date().toISOString());
  };

  const earnTokens = (amount, description) => {
    if (!user || isFeatureEnabled('STEALTH_MODE')) return;

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
    if (!user || isFeatureEnabled('STEALTH_MODE')) return false;
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
    if (isFeatureEnabled('STEALTH_MODE')) return 0;
    return user?.phyghtTokenBalance || 0;
  };

  const getOwnerBalance = () => {
    return isAdmin ? ownerBalance : 0;
  };

  const getTokenSupply = () => {
    return isAdmin ? tokenSupply : 0;
  };

  const transferTokens = (toAddress, amount, description) => {
    if (!isAdmin || amount > ownerBalance) return false;
    
    // Simulate token transfer
    setOwnerBalance(prev => prev - amount);
    
    const transaction = {
      id: Date.now().toString(),
      type: 'transfer',
      amount: -amount,
      timestamp: new Date().toISOString(),
      description: `Transfer to ${toAddress}: ${description}`,
      recipient: toAddress
    };

    setTransactions(prev => [transaction, ...prev]);
    return true;
  };

  const getMintingInfo = () => {
    if (!isAdmin) return null;
    
    return {
      isMinted: isTokensMinted,
      totalSupply: tokenSupply,
      ownerBalance: ownerBalance,
      mintTimestamp: localStorage.getItem('phyght_mint_timestamp'),
      contractAddress: 'TBD', // Will be set when deployed to blockchain
    };
  };

  const value = {
    transactions: isFeatureEnabled('STEALTH_MODE') ? [] : transactions,
    dailyEarnings: isFeatureEnabled('STEALTH_MODE') ? 0 : dailyEarnings,
    earnTokens,
    spendTokens,
    getTokenBalance,
    getOwnerBalance,
    getTokenSupply,
    transferTokens,
    getMintingInfo,
    isTokensMinted,
    tokenSupply,
    ownerBalance
  };

  return (
    <TokenContext.Provider value={value}>
      {children}
    </TokenContext.Provider>
  );
};
