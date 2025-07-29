import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TokenProvider } from './context/TokenContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import ContentLibrary from './pages/ContentLibrary';
import Profile from './pages/Profile';
import Subscription from './pages/Subscription';

function App() {
  return (
    <AuthProvider>
      <TokenProvider>
        <Router>
          <div className="min-h-screen bg-darker">
            <Header />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/library" element={<ContentLibrary />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/subscription" element={<Subscription />} />
              </Routes>
            </main>
          </div>
        </Router>
      </TokenProvider>
    </AuthProvider>
  );
}

export default App;