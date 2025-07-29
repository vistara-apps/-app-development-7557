import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Zap, User, Library, CreditCard, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="bg-dark border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold gradient-bg bg-clip-text text-transparent">
                Phyght
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/library" className="text-gray-300 hover:text-white transition-colors">
                <Library className="h-5 w-5 inline mr-2" />
                Library
              </Link>
              
              {isAuthenticated && (
                <>
                  <Link to="/profile" className="text-gray-300 hover:text-white transition-colors">
                    <User className="h-5 w-5 inline mr-2" />
                    Profile
                  </Link>
                  <Link to="/subscription" className="text-gray-300 hover:text-white transition-colors">
                    <CreditCard className="h-5 w-5 inline mr-2" />
                    Premium
                  </Link>
                </>
              )}
            </nav>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {isAuthenticated && (
                <div className="hidden md:flex items-center space-x-4">
                  <span className="token-badge">
                    {user.phyghtTokenBalance} PHY
                  </span>
                </div>
              )}
              
              <ConnectButton />
              
              {isAuthenticated ? (
                <div className="hidden md:flex items-center space-x-2">
                  <span className="text-sm text-gray-300">Welcome, {user.username}</span>
                  <button
                    onClick={logout}
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="btn-primary hidden md:block"
                >
                  Sign In
                </button>
              )}

              {/* Mobile menu button */}
              <button
                className="md:hidden text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-800 py-4">
              <nav className="space-y-4">
                <Link
                  to="/library"
                  className="block text-gray-300 hover:text-white transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Library className="h-5 w-5 inline mr-2" />
                  Library
                </Link>
                
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      className="block text-gray-300 hover:text-white transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-5 w-5 inline mr-2" />
                      Profile
                    </Link>
                    <Link
                      to="/subscription"
                      className="block text-gray-300 hover:text-white transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <CreditCard className="h-5 w-5 inline mr-2" />
                      Premium
                    </Link>
                    <div className="flex items-center justify-between">
                      <span className="token-badge">
                        {user.phyghtTokenBalance} PHY
                      </span>
                      <button
                        onClick={() => {
                          logout();
                          setMobileMenuOpen(false);
                        }}
                        className="text-sm text-gray-400 hover:text-white"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setShowAuthModal(true);
                      setMobileMenuOpen(false);
                    }}
                    className="btn-primary w-full"
                  >
                    Sign In
                  </button>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
}

export default Header;