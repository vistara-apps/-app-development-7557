import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAuth } from '../context/AuthContext';
import { useToken } from '../context/TokenContext';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { User, Menu, X, Crown, Coins, Zap, Shield } from 'lucide-react';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout, openAuthModal } = useAuth();
  const { getTokenBalance } = useToken();
  const { isFeatureEnabled, isAdmin } = useFeatureFlags();
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/', current: location.pathname === '/' },
    { name: 'Browse', href: '/browse', current: location.pathname === '/browse' },
    { name: 'Dashboard', href: '/dashboard', current: location.pathname === '/dashboard' },
  ];

  return (
    <header className="bg-dark-800 border-b border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-red-500">Phyght</span>
            {isAdmin && (
              <Shield className="w-4 h-4 text-yellow-500" title="Admin Access" />
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  item.current
                    ? 'text-red-500 border-b-2 border-red-500'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {user && !isFeatureEnabled('STEALTH_MODE') && (
              <div className="hidden sm:flex items-center space-x-2 bg-dark-900 px-3 py-1 rounded-full">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">{getTokenBalance()}</span>
              </div>
            )}

            {/* Admin Dashboard Access */}
            {isAdmin && (
              <Link
                to="/admin-phyght-2024"
                className="hidden sm:flex items-center space-x-1 bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded-full text-white text-sm transition-colors"
              >
                <Shield className="w-3 h-3" />
                <span>Admin</span>
              </Link>
            )}

            {user ? (
              <div className="flex items-center space-x-4">
                {user.subscriptionStatus === 'premium' && !isFeatureEnabled('STEALTH_MODE') && (
                  <div className="hidden sm:flex items-center space-x-1 bg-gradient-to-r from-yellow-500 to-yellow-600 px-2 py-1 rounded-full">
                    <Crown className="w-3 h-3" />
                    <span className="text-xs font-medium text-white">Premium</span>
                  </div>
                )}
                
                <ConnectButton />
                
                <div className="relative group">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 text-gray-300 hover:text-white"
                  >
                    <User className="w-5 h-5" />
                    <span className="hidden sm:inline text-sm">{user.username}</span>
                  </Link>
                </div>
                
                <button
                  onClick={logout}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <ConnectButton />
                <button
                  onClick={() => openAuthModal('login')}
                  className="text-gray-300 hover:text-white text-sm"
                >
                  Login
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Join Now
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-gray-400 hover:text-white"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-dark-900 border-t border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                  item.current
                    ? 'text-primary-500 bg-dark-800'
                    : 'text-gray-300 hover:text-white hover:bg-dark-800'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
