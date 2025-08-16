import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { User, Menu, X, Upload, Shield } from 'lucide-react';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout, openAuthModal } = useAuth();
  const { isFeatureEnabled, isAdmin } = useFeatureFlags();
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/', current: location.pathname === '/' },
    { name: 'Browse', href: '/browse', current: location.pathname === '/browse' },
    { name: 'Dashboard', href: '/dashboard', current: location.pathname === '/dashboard' },
  ];

  return (
    <header className="bg-gradient-to-r from-phyght-black via-phyght-gray to-phyght-black border-b border-phyght-gray-light sticky top-0 z-40 shadow-phyght-red backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* PHYGHT Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-phyght-white to-gray-100 text-phyght-black px-4 py-2 rounded-xl font-black text-xl font-phyght tracking-wider shadow-lg group-hover:shadow-phyght-red transition-all duration-300 transform group-hover:scale-105">
                PHYGHT
              </div>
              <div className="bg-gradient-to-r from-phyght-red to-phyght-red-dark text-phyght-white px-3 py-2 rounded-xl font-black text-xl ml-2 font-phyght tracking-wider shadow-phyght-red group-hover:shadow-phyght-red-lg transition-all duration-300 transform group-hover:scale-105">
                TV
              </div>
            </div>
            {isAdmin && (
              <div className="ml-3 p-2 bg-gradient-to-r from-phyght-red to-phyght-red-dark rounded-lg shadow-phyght-red">
                <Shield className="w-5 h-5 text-phyght-white" title="Admin Access" />
              </div>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-4 py-2 text-sm font-semibold transition-all duration-300 rounded-lg ${
                  item.current
                    ? 'text-phyght-white bg-gradient-to-r from-phyght-red to-phyght-red-dark shadow-phyght-red'
                    : 'text-gray-300 hover:text-phyght-white hover:bg-phyght-gray-light'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">

            {/* Admin Dashboard Access */}
            {isAdmin && (
              <Link
                to="/admin-phyght-2024"
                className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-phyght-red to-phyght-red-dark hover:from-phyght-red-dark hover:to-phyght-red text-phyght-white px-4 py-2 rounded-xl text-sm transition-all duration-300 font-semibold shadow-phyght-red hover:shadow-phyght-red-lg transform hover:scale-105"
              >
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}

            <div className="flex items-center space-x-3">
              {/* Upload Video Button - Always visible */}
              <Link
                to="/upload"
                className="flex items-center space-x-2 bg-gradient-to-r from-phyght-red to-phyght-red-dark hover:from-phyght-red-dark hover:to-phyght-red text-phyght-white px-4 py-2 rounded-xl text-sm transition-all duration-300 font-semibold shadow-phyght-red hover:shadow-phyght-red-lg transform hover:scale-105"
              >
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </Link>
              
              {user ? (
                <div className="flex items-center space-x-4">
                  
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
                  <button
                    onClick={() => openAuthModal('login')}
                    className="text-gray-300 hover:text-white text-sm"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => openAuthModal('register')}
                    className="bg-gradient-to-r from-phyght-red to-phyght-red-dark hover:from-phyght-red-dark hover:to-phyght-red text-phyght-white px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-300 shadow-phyght-red hover:shadow-phyght-red-lg transform hover:scale-105"
                  >
                    Join Now
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-gray-400 hover:text-phyght-white transition-all duration-300 p-2 rounded-lg hover:bg-phyght-gray-light"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gradient-to-b from-phyght-gray to-phyght-gray-light border-t border-phyght-gray-light">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-3 text-base font-semibold rounded-xl transition-all duration-300 ${
                  item.current
                    ? 'text-phyght-white bg-gradient-to-r from-phyght-red to-phyght-red-dark shadow-phyght-red'
                    : 'text-gray-300 hover:text-phyght-white hover:bg-phyght-gray-light'
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
