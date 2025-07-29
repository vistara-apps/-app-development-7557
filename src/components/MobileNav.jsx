import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, BarChart3, User } from 'lucide-react';

const MobileNav = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/', icon: Home, current: location.pathname === '/' },
    { name: 'Browse', href: '/browse', icon: Search, current: location.pathname === '/browse' },
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3, current: location.pathname === '/dashboard' },
    { name: 'Profile', href: '/profile', icon: User, current: location.pathname === '/profile' },
  ];

  return (
    <nav className="mobile-nav bg-dark-800 border-t border-gray-700 px-4 py-2">
      <div className="flex justify-around">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                item.current
                  ? 'text-primary-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;