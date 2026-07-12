import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Globe, 
  Search, 
  Sun, 
  Moon, 
  Shield, 
  LogOut, 
  Menu, 
  X, 
  TrendingUp,
  ShoppingBag,
  User as UserIcon,
  Mail
} from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, userProfile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const categories = [
    { name: 'Business', slug: 'business-finance' },
    { name: 'Tech', slug: 'tech-innovation' },
    { name: 'Politics', slug: 'politics-policy' },
    { name: 'Style', slug: 'style-luxury' },
    { name: 'Science', slug: 'science-health' }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">
                BOSS<span className="text-violet-600 dark:text-violet-400">.NEWS</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-1 xl:space-x-4 items-center">
            <Link 
              to="/world" 
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                location.pathname === '/world'
                  ? 'text-violet-600 dark:text-violet-400 bg-slate-100 dark:bg-slate-900' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/50'
              }`}
            >
              <Globe className="w-4 h-4" />
              World
            </Link>

            <Link 
              to="/marketplace" 
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                location.pathname === '/marketplace'
                  ? 'text-violet-600 dark:text-violet-400 bg-slate-100 dark:bg-slate-900' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/50'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Marketplace
            </Link>

            <Link 
              to="/gmail" 
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                location.pathname === '/gmail'
                  ? 'text-violet-600 dark:text-violet-400 bg-slate-100 dark:bg-slate-900' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/50'
              }`}
            >
              <Mail className="w-4 h-4" />
              Gmail Desk
            </Link>
            
            <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1"></div>

            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/category/${cat.slug}`}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  location.pathname === `/category/${cat.slug}`
                    ? 'text-violet-600 dark:text-violet-400 bg-slate-100 dark:bg-slate-900' 
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/50'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </nav>

          {/* Search, Theme Toggle, Auth Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search global news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 xl:w-60 px-4 py-2 pl-10 pr-4 text-sm bg-slate-100 dark:bg-slate-900 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:text-white transition-all duration-300 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <Search className="absolute left-3.5 top-2.5 w-4.5 h-4.5 text-slate-400 dark:text-slate-500" />
            </form>

            {/* Theme switch */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-all duration-300"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Auth section */}
            {user && (
              <div className="flex items-center space-x-3 pl-2 border-l border-slate-200 dark:border-slate-800">
                {(userProfile?.role === 'admin' || userProfile?.role === 'editor' || user.email === 'makealuckspam@gmail.com') && (
                  <Link 
                    to="/admin" 
                    className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 text-white text-sm font-bold rounded-full shadow-lg shadow-violet-500/20 transition-all active:scale-95"
                  >
                    <Shield className="w-4 h-4" />
                    Admin
                  </Link>
                )}
                
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    <UserIcon className="w-4.5 h-4.5" />
                  </div>
                  <div className="hidden xl:block">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[100px]">
                      {userProfile?.displayName || user.email?.split('@')[0]}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                      {userProfile?.role}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={signOut}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-300"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 pt-4 pb-6 space-y-4 shadow-xl">
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              placeholder="Search global news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 pr-4 text-sm bg-slate-100 dark:bg-slate-900 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:text-white"
            />
            <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
          </form>

          <div className="space-y-1">
            <Link 
              to="/world" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-3 rounded-lg text-base font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              <Globe className="w-5 h-5 text-violet-500" />
              World Coverage
            </Link>

            <Link 
              to="/marketplace" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-3 rounded-lg text-base font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              <ShoppingBag className="w-5 h-5 text-violet-500" />
              Marketplace Store
            </Link>

            <Link 
              to="/gmail" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-3 rounded-lg text-base font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              <Mail className="w-5 h-5 text-violet-500" />
              Gmail Desk
            </Link>
            
            <div className="border-t border-slate-100 dark:border-slate-900 my-2"></div>
            
            <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Categories</p>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/category/${cat.slug}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                {cat.name}
              </Link>
            ))}
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
            {user && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {userProfile?.displayName || user.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">
                      Role: {userProfile?.role}
                    </p>
                  </div>
                </div>

                {(userProfile?.role === 'admin' || userProfile?.role === 'editor' || user.email === 'makealuckspam@gmail.com') && (
                  <Link 
                    to="/admin" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-violet-600 dark:bg-violet-500 text-white font-bold rounded-lg"
                  >
                    <Shield className="w-4.5 h-4.5" />
                    Admin Dashboard
                  </Link>
                )}

                <button 
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-slate-100 dark:bg-slate-900 text-red-500 font-medium rounded-lg"
                >
                  <LogOut className="w-4.5 h-4.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
