import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Browse from './pages/Browse';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import MobileNav from './components/MobileNav';
import AuthModal from './components/AuthModal';
import SubscriptionModal from './components/SubscriptionModal';
import { AuthProvider } from './context/AuthContext';
import { ContentProvider } from './context/ContentContext';
import { TokenProvider } from './context/TokenContext';
import { useFeatureFlags } from './hooks/useFeatureFlags';

function App() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <AuthProvider>
      <TokenProvider>
        <ContentProvider>
          <Router>
            <div className="min-h-screen bg-dark-900">
              <Header />
              
              <main className={isMobile ? "pb-20" : ""}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/browse" element={<Browse />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin-phyght-2024" element={<AdminDashboard />} />
                </Routes>
              </main>

              {isMobile && <MobileNav />}
              
              <AuthModal />
              <SubscriptionModal />
            </div>
          </Router>
        </ContentProvider>
      </TokenProvider>
    </AuthProvider>
  );
}

export default App;
