import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { newsService } from '../services/newsService';
import { seedDatabaseIfEmpty } from '../lib/dbSeeder';
import { Article, Category, Tag } from '../types';
import { 
  TrendingUp, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  SlidersHorizontal, 
  X, 
  Eye, 
  Calendar,
  AlertCircle
} from 'lucide-react';

const Home: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeRegion, setActiveRegion] = useState<string>('all');
  const [activeTag, setActiveTag] = useState<string>('all');
  const [heroIndex, setHeroIndex] = useState(0);

  const searchVal = searchParams.get('search') || '';

  const loadData = async () => {
    setLoading(true);
    try {
      let arts = await newsService.getArticles();
      if (arts.length === 0) {
        await seedDatabaseIfEmpty();
        arts = await newsService.getArticles();
      }
      setArticles(arts);

      const cats = await newsService.getCategories();
      setCategories(cats);

      const tgs = await newsService.getTags();
      setTags(tgs);
    } catch (error) {
      console.error("Error loading home page data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync category or region search params if any
  useEffect(() => {
    const catParam = searchParams.get('category');
    const regParam = searchParams.get('region');
    if (catParam) setActiveCategory(catParam);
    if (regParam) setActiveRegion(regParam);
  }, [searchParams]);

  // Filtering logic
  const filteredArticles = articles.filter(art => {
    // Only show published articles on the public home page
    if (art.status !== 'published') return false;

    // Search filter
    if (searchVal) {
      const query = searchVal.toLowerCase();
      const matchTitle = art.title.toLowerCase().includes(query);
      const matchSubtitle = art.subtitle?.toLowerCase().includes(query) || false;
      const matchContent = art.content.toLowerCase().includes(query);
      if (!matchTitle && !matchSubtitle && !matchContent) return false;
    }

    // Category filter
    if (activeCategory !== 'all' && art.category !== activeCategory) {
      return false;
    }

    // Region filter
    if (activeRegion !== 'all' && art.region !== activeRegion) {
      return false;
    }

    // Tag filter
    if (activeTag !== 'all' && !art.tags.includes(activeTag)) {
      return false;
    }

    return true;
  });

  // Featured Hero Articles (carousel)
  const featuredArticles = articles.filter(art => art.featured && art.status === 'published');
  const breakingArticles = articles.filter(art => art.breaking && art.status === 'published');

  const handlePrevHero = () => {
    setHeroIndex(prev => (prev === 0 ? featuredArticles.length - 1 : prev - 1));
  };

  const handleNextHero = () => {
    setHeroIndex(prev => (prev === featuredArticles.length - 1 ? 0 : prev + 1));
  };

  const clearAllFilters = () => {
    setActiveCategory('all');
    setActiveRegion('all');
    setActiveTag('all');
    setSearchParams({});
  };

  const regions = ['all', 'World', 'North America', 'Europe', 'Asia', 'Middle East'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 pb-20">
      
      {/* 1. BREAKING NEWS TICKER */}
      {breakingArticles.length > 0 && (
        <div className="bg-red-600 dark:bg-red-950 text-white py-3 px-4 overflow-hidden border-b border-red-700/30 flex items-center gap-4">
          <span className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 bg-white text-red-600 font-black text-xs uppercase rounded-full animate-pulse tracking-widest">
            <AlertCircle className="w-3.5 h-3.5" />
            Breaking
          </span>
          <div className="relative flex-1 overflow-hidden h-6">
            <div className="absolute flex whitespace-nowrap gap-16 animate-[marquee_30s_linear_infinite] hover:[animation-play-state:paused] font-bold text-sm tracking-wide">
              {breakingArticles.map((art, idx) => (
                <Link key={idx} to={`/article/${art.slug}`} className="hover:underline flex items-center gap-2">
                  <span>•</span> {art.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* 2. FEATURED HERO SLIDER */}
        {featuredArticles.length > 0 && !searchVal && activeCategory === 'all' && activeRegion === 'all' && activeTag === 'all' && (
          <div className="relative h-[450px] md:h-[550px] rounded-3xl overflow-hidden shadow-2xl bg-slate-900 mb-12 group">
            {/* Background Image */}
            <AnimatePresence mode="wait">
              <motion.div
                key={heroIndex}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0"
              >
                <img 
                  src={featuredArticles[heroIndex].imageUrl || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop'} 
                  alt={featuredArticles[heroIndex].title}
                  className="w-full h-full object-cover opacity-60 dark:opacity-40"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-slate-950/20" />
              </motion.div>
            </AnimatePresence>

            {/* Slider Controls */}
            <button 
              onClick={handlePrevHero}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={handleNextHero}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Slide Info */}
            <div className="absolute bottom-0 inset-x-0 p-6 md:p-12 flex flex-col justify-end text-white max-w-4xl">
              <motion.div
                key={`info-${heroIndex}`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-violet-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                    Featured
                  </span>
                  <span className="text-xs text-slate-300 font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(featuredArticles[heroIndex].publishedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                  </span>
                </div>

                <Link to={`/article/${featuredArticles[heroIndex].slug}`}>
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight hover:text-violet-400 transition-colors leading-tight">
                    {featuredArticles[heroIndex].title}
                  </h1>
                </Link>

                <p className="text-slate-300 text-sm md:text-lg font-medium leading-relaxed max-w-3xl line-clamp-2 md:line-clamp-none">
                  {featuredArticles[heroIndex].subtitle}
                </p>

                <div className="flex items-center gap-4 pt-2">
                  <span className="text-xs font-black tracking-widest uppercase text-slate-400">
                    By {featuredArticles[heroIndex].author}
                  </span>
                  <div className="h-3 w-[1px] bg-slate-600"></div>
                  <span className="text-xs font-black uppercase text-violet-400 tracking-wider">
                    {featuredArticles[heroIndex].region}
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Bullet indicators */}
            <div className="absolute right-6 bottom-6 flex gap-1.5">
              {featuredArticles.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setHeroIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${idx === heroIndex ? 'bg-violet-500 w-8' : 'bg-white/40'}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* 3. SEARCH STATE & FILTER INDICATOR HEADER */}
        {(searchVal || activeCategory !== 'all' || activeRegion !== 'all' || activeTag !== 'all') && (
          <div className="mb-8 p-6 bg-slate-100 dark:bg-slate-900 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest font-black text-slate-400 dark:text-slate-500 mb-1">Search & Filters Active</p>
              <h2 className="text-2xl font-extrabold flex items-center gap-2">
                {searchVal ? `Showing results for "${searchVal}"` : "Filtered Intel Feed"}
                <span className="text-sm px-3 py-1 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 font-bold">
                  {filteredArticles.length} articles found
                </span>
              </h2>
              <div className="flex flex-wrap gap-2 mt-3">
                {activeCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 text-xs font-bold rounded-full">
                    Category: {categories.find(c => c.slug === activeCategory)?.name || activeCategory}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setActiveCategory('all')} />
                  </span>
                )}
                {activeRegion !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full">
                    Region: {activeRegion}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setActiveRegion('all')} />
                  </span>
                )}
                {activeTag !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-full">
                    Tag: #{activeTag}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setActiveTag('all')} />
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={clearAllFilters}
              className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-sm font-bold rounded-full transition-all self-start md:self-center"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* 4. QUICK FILTER CONTROLS BAR */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6 mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
              <SlidersHorizontal className="w-4 h-4" />
              Filter by Region:
            </span>
            <div className="flex flex-wrap gap-1">
              {regions.map((reg) => (
                <button
                  key={reg}
                  onClick={() => setActiveRegion(reg)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all ${
                    activeRegion === reg 
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' 
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  {reg === 'all' ? 'All Regions' : reg}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Category:</span>
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.slug} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 5. MAIN CONTENT LAYOUT: Feed Grid + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Feed Column */}
          <div className="lg:col-span-2 space-y-8">
            <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2 mb-6">
              Latest Dispatch
              <span className="h-[2px] bg-violet-500 flex-grow rounded-full"></span>
            </h3>

            {loading ? (
              // Skeleton loaders
              <div className="space-y-8">
                {[1, 2, 3].map(n => (
                  <div key={n} className="flex flex-col md:flex-row gap-6 animate-pulse">
                    <div className="w-full md:w-48 h-36 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
                    <div className="flex-1 space-y-4 py-1">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
                      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-20 bg-slate-100 dark:bg-slate-900 rounded-3xl">
                <p className="text-lg font-bold text-slate-500">No articles matching these criteria found.</p>
                <button 
                  onClick={clearAllFilters}
                  className="mt-4 px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-full transition-all"
                >
                  Reset Dispatch Filters
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                <AnimatePresence>
                  {filteredArticles.map((art, index) => (
                    <motion.article 
                      key={art.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.4 }}
                      className="flex flex-col md:flex-row gap-6 p-4 rounded-3xl bg-white dark:bg-slate-900 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/20 border border-slate-100 dark:border-slate-900 transition-all duration-300 group"
                    >
                      {/* Image container */}
                      <div className="w-full md:w-56 h-40 flex-shrink-0 rounded-2xl overflow-hidden relative bg-slate-950">
                        <img 
                          src={art.imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200&auto=format&fit=crop'} 
                          alt={art.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        {art.breaking && (
                          <span className="absolute top-3 left-3 px-2 py-0.5 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded">
                            Breaking
                          </span>
                        )}
                        <span className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold tracking-wide rounded">
                          {art.region}
                        </span>
                      </div>

                      {/* Content details */}
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                              {categories.find(c => c.slug === art.category)?.name || art.category}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(art.publishedAt).toLocaleDateString()}
                            </span>
                          </div>

                          <Link to={`/article/${art.slug}`}>
                            <h4 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors leading-snug">
                              {art.title}
                            </h4>
                          </Link>

                          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                            {art.subtitle || art.content.slice(0, 150) + '...'}
                          </p>
                        </div>

                        {/* Views and Authors */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            By {art.author}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            {art.views?.toLocaleString() || 0} views
                          </span>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Sidebar Column */}
          <div className="space-y-10">
            
            {/* Tag Cloud */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-900 rounded-3xl p-6">
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-1.5 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <TrendingUp className="w-4 h-4 text-violet-500" />
                Trending Intel Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTag('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                    activeTag === 'all' 
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  #all
                </button>
                {tags.map((tg) => (
                  <button
                    key={tg.slug}
                    onClick={() => setActiveTag(tg.slug)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                      activeTag === tg.slug 
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    #{tg.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Newsletter form */}
            <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-violet-600 to-indigo-800 dark:from-violet-900 dark:to-slate-950 text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/20 rounded-full blur-2xl"></div>
              <h4 className="text-xl font-black tracking-tight mb-2">Subscribe to the dispatch</h4>
              <p className="text-xs text-violet-200 mb-4 leading-relaxed">
                Receive sovereign high-impact macro insights, tech breakthroughs, and style alerts directly in your private terminal.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); alert("Subscription saved in premium terminal channels!"); }} className="space-y-2">
                <input 
                  type="email" 
                  placeholder="name@domain.com"
                  required
                  className="w-full px-4 py-2 bg-white/15 focus:bg-white/20 border border-white/20 rounded-xl text-sm text-white placeholder:text-violet-200 outline-none focus:ring-2 focus:ring-white transition-all"
                />
                <button 
                  type="submit"
                  className="w-full py-2.5 bg-white text-violet-800 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-violet-100 active:scale-95 transition-all"
                >
                  Secure Access
                </button>
              </form>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default Home;
