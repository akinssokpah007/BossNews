import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { newsService } from '../services/newsService';
import { Article, Category } from '../types';
import { Globe, Clock, Eye, SlidersHorizontal, Calendar, ArrowUpRight } from 'lucide-react';

const WorldNews: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const activeRegion = searchParams.get('region') || 'all';
  const activeCategory = searchParams.get('category') || 'all';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const arts = await newsService.getArticles();
        setArticles(arts);
        const cats = await newsService.getCategories();
        setCategories(cats);
      } catch (error) {
        console.error("Error loading world news data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const selectRegion = (reg: string) => {
    const params: any = {};
    if (reg !== 'all') params.region = reg;
    if (activeCategory !== 'all') params.category = activeCategory;
    setSearchParams(params);
  };

  const selectCategory = (cat: string) => {
    const params: any = {};
    if (activeRegion !== 'all') params.region = activeRegion;
    if (cat !== 'all') params.category = cat;
    setSearchParams(params);
  };

  const filteredArticles = articles.filter(art => {
    if (art.status !== 'published') return false;
    
    const matchesRegion = activeRegion === 'all' || art.region === activeRegion;
    const matchesCategory = activeCategory === 'all' || art.category === activeCategory;
    
    return matchesRegion && matchesCategory;
  });

  const regions = ['all', 'World', 'North America', 'Europe', 'Asia', 'Middle East'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 pb-20">
      
      {/* HEADER HERO */}
      <div className="relative py-20 overflow-hidden bg-slate-900 text-white">
        {/* Globe icon watermark background */}
        <div className="absolute right-[-100px] bottom-[-100px] text-slate-800/20 dark:text-slate-800/10 opacity-30 select-none pointer-events-none">
          <Globe className="w-[500px] h-[500px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-4">
          <span className="px-3 py-1 bg-violet-600 text-[10px] font-black uppercase tracking-widest rounded-full">
            Global Dispatch
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none uppercase">
            World coverage
          </h1>
          <p className="text-slate-300 max-w-2xl font-medium leading-relaxed text-sm md:text-base">
            Track breaking stories, legislative treaties, and corporate pivots filtered by sovereign territory, trading bloc, and continental hubs.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        
        {/* INTERACTIVE FILTERS BLOCK */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-900 shadow-xl mb-12 space-y-6">
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
              <SlidersHorizontal className="w-4 h-4" /> Filter Global Intel Grid
            </h3>
            
            {/* Region selection */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trading Blocs & Geopolitics</p>
              <div className="flex flex-wrap gap-1.5">
                {regions.map((reg) => (
                  <button
                    key={reg}
                    onClick={() => selectRegion(reg)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
                      activeRegion === reg 
                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {reg === 'all' ? 'All Territories' : reg}
                  </button>
                ))}
              </div>
            </div>

            {/* Category selection */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/50">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Industry & Category</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => selectCategory('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
                    activeCategory === 'all' 
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => selectCategory(cat.slug)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
                      activeCategory === cat.slug 
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* RESULTS HEADLINE */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Dispensing {filteredArticles.length} matching global records
          </p>
          {(activeRegion !== 'all' || activeCategory !== 'all') && (
            <button 
              onClick={() => setSearchParams({})}
              className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
            >
              Reset World filters
            </button>
          )}
        </div>

        {/* GRID DISPLAY */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(n => (
              <div key={n} className="animate-pulse bg-white dark:bg-slate-900 rounded-3xl h-[400px] border border-slate-100 dark:border-slate-800"></div>
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-900 shadow-xl">
            <Globe className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-lg font-bold text-slate-500">No sovereign articles resolved in this query.</p>
            <p className="text-sm text-slate-400 mt-1">Try expanding your category or region parameters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((art) => (
              <motion.article
                key={art.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Photo cover */}
                  <div className="h-48 overflow-hidden relative bg-slate-950">
                    <img 
                      src={art.imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200&auto=format&fit=crop'} 
                      alt={art.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute top-4 left-4 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-widest rounded-lg">
                      {art.region}
                    </span>
                    <span className="absolute bottom-4 right-4 px-2.5 py-1 bg-violet-600/90 text-white text-[9px] font-bold tracking-wider rounded-lg">
                      {categories.find(c => c.slug === art.category)?.name || art.category}
                    </span>
                  </div>

                  {/* Body Info */}
                  <div className="p-6 space-y-3">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(art.publishedAt).toLocaleDateString()}
                    </p>
                    
                    <Link to={`/article/${art.slug}`}>
                      <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {art.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3">
                      {art.subtitle || art.content.slice(0, 100) + '...'}
                    </p>
                  </div>
                </div>

                {/* Footer details */}
                <div className="px-6 pb-6 pt-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    By {art.author}
                  </span>
                  <Link 
                    to={`/article/${art.slug}`}
                    className="text-violet-600 dark:text-violet-400 hover:text-violet-700 text-xs font-black uppercase tracking-wider flex items-center gap-1"
                  >
                    Read
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        )}

      </div>

    </div>
  );
};

export default WorldNews;
