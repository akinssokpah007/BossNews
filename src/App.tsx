import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import ArticlePage from './pages/ArticlePage';
import WorldNews from './pages/WorldNews';
import AdminDashboard from './pages/AdminDashboard';
import Marketplace from './pages/Marketplace';
import GmailHub from './pages/GmailHub';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/article/:slug" element={<ArticlePage />} />
                <Route path="/world" element={<WorldNews />} />
                {/* Re-route category slug directly into WorldNews with category parameters */}
                <Route path="/category/:slug" element={<WorldNews />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/gmail" element={<GmailHub />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
