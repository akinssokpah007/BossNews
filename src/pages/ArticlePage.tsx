import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { newsService } from '../services/newsService';
import { Article, Category } from '../types';
import { 
  Clock, 
  ArrowLeft, 
  Eye, 
  Share2, 
  Globe, 
  Folder, 
  Calendar,
  Bookmark
} from 'lucide-react';

// A lightweight, highly resilient markdown to JSX renderer for premium typography
function renderMarkdown(text: string = '') {
  const lines = text.split('\n');
  let elements: React.JSX.Element[] = [];
  let currentList: { type: 'ul' | 'ol', items: string[] } | null = null;

  const pushList = (key: string) => {
    if (currentList) {
      if (currentList.type === 'ul') {
        elements.push(
          <ul key={key} className="list-disc pl-6 my-4 space-y-2 text-slate-700 dark:text-slate-300">
            {currentList.items.map((it, idx) => <li key={idx} dangerouslySetInnerHTML={{ __html: parseInline(it) }} />)}
          </ul>
        );
      } else {
        elements.push(
          <ol key={key} className="list-decimal pl-6 my-4 space-y-2 text-slate-700 dark:text-slate-300">
            {currentList.items.map((it, idx) => <li key={idx} dangerouslySetInnerHTML={{ __html: parseInline(it) }} />)}
          </ol>
        );
      }
      currentList = null;
    }
  };

  const parseInline = (str: string) => {
    // Bold: **text**
    let parsed = str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic: *text*
    parsed = parsed.replace(/\*(.*?)\*/g, '<em>$1</em>');
    return parsed;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Headers
    if (trimmed.startsWith('## ')) {
      pushList(`list-before-h2-${index}`);
      elements.push(
        <h2 key={index} className="text-2xl font-extrabold text-slate-900 dark:text-white mt-10 mb-4 tracking-tight">
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith('### ')) {
      pushList(`list-before-h3-${index}`);
      elements.push(
        <h3 key={index} className="text-xl font-bold text-slate-800 dark:text-slate-200 mt-6 mb-3 tracking-tight">
          {trimmed.slice(4)}
        </h3>
      );
    }
    // Blockquote
    else if (trimmed.startsWith('> ')) {
      pushList(`list-before-bq-${index}`);
      elements.push(
        <blockquote key={index} className="border-l-4 border-violet-500 pl-4 py-1 my-6 italic text-slate-600 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-900/50 rounded-r-lg">
          {parseInline(trimmed.slice(2))}
        </blockquote>
      );
    }
    // Horizontal Rule
    else if (trimmed === '---') {
      pushList(`list-before-hr-${index}`);
      elements.push(<hr key={index} className="my-8 border-slate-200 dark:border-slate-800" />);
    }
    // Bullet List
    else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      if (!currentList || currentList.type !== 'ul') {
        pushList(`list-transition-ul-${index}`);
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(trimmed.slice(2));
    }
    // Numbered List
    else if (/^\d+\.\s/.test(trimmed)) {
      const match = trimmed.match(/^\d+\.\s(.*)/);
      if (match) {
        if (!currentList || currentList.type !== 'ol') {
          pushList(`list-transition-ol-${index}`);
          currentList = { type: 'ol', items: [] };
        }
        currentList.items.push(match[1]);
      }
    }
    // Empty line
    else if (trimmed === '') {
      pushList(`list-before-empty-${index}`);
    }
    // Paragraph
    else {
      pushList(`list-before-p-${index}`);
      elements.push(
        <p key={index} className="text-lg leading-relaxed text-slate-700 dark:text-slate-300 mb-6" dangerouslySetInnerHTML={{ __html: parseInline(trimmed) }} />
      );
    }
  });

  pushList('list-final');
  return elements;
}

const ArticlePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const art = await newsService.getArticleBySlug(slug);
        if (art) {
          setArticle(art);
          // Increment views count in database (non-blocking background call)
          newsService.incrementViews(art.id).catch(err => console.warn(err));
        }
        const cats = await newsService.getCategories();
        setCategories(cats);
      } catch (error) {
        console.error("Error loading article page:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [slug]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Retrieving Dispatch...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-center py-20">
        <p className="text-xl font-bold text-slate-500">The requested article could not be resolved in the secure news feed.</p>
        <Link to="/" className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm rounded-full">
          <ArrowLeft className="w-4 h-4" /> Return to Main Feed
        </Link>
      </div>
    );
  }

  const articleCategory = categories.find(c => c.slug === article.category);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "image": [
      article.imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200&auto=format&fit=crop'
    ],
    "datePublished": article.createdAt || new Date().toISOString(),
    "dateModified": article.createdAt || new Date().toISOString(),
    "author": [{
      "@type": "Person",
      "name": article.author || 'Akin S. Sokpah',
      "url": 'https://ais-pre-zuhodhxob77wcr6tb4yo4i-561699256494.europe-west1.run.app'
    }],
    "publisher": {
      "@type": "NewsMediaOrganization",
      "name": "BossNews",
      "logo": {
        "@type": "ImageObject",
        "url": 'https://ais-pre-zuhodhxob77wcr6tb4yo4i-561699256494.europe-west1.run.app/src/assets/images/boss_news_logo_1783871304137.jpg'
      }
    },
    "description": article.subtitle || article.snippet || "A premium breaking news article published on BossNews."
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 pb-20">
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
      
      {/* 1. ARTICLE BANNER HERO */}
      <div className="relative w-full h-[380px] md:h-[500px] overflow-hidden bg-slate-950">
        <img 
          src={article.imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200&auto=format&fit=crop'} 
          alt={article.title}
          className="w-full h-full object-cover opacity-50 dark:opacity-40"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-slate-950 via-transparent to-transparent" />
        
        {/* Upper controls over banner */}
        <div className="absolute top-6 left-6 md:left-12 z-10">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-black/60 text-white font-semibold text-xs uppercase tracking-widest backdrop-blur-md rounded-full transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Main Feed
          </Link>
        </div>
      </div>

      {/* 2. MAIN LAYOUT: Centered Reader */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-20">
        
        {/* Article Details Card Container */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-12 shadow-2xl border border-slate-100 dark:border-slate-800"
        >
          {/* Tag & Meta bar */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="px-3 py-1 bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 text-[10px] font-black uppercase tracking-widest rounded-full">
              {articleCategory?.name || article.category}
            </span>
            <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              {article.region} ({article.country})
            </span>
            {article.breaking && (
              <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded animate-pulse">
                Breaking
              </span>
            )}
          </div>

          {/* Title and Subtitle */}
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight mb-4">
            {article.title}
          </h1>

          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">
            {article.subtitle}
          </p>

          {/* Author/Date Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-slate-100 dark:border-slate-800/80 mb-8 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {article.author.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-extrabold text-slate-900 dark:text-white">
                  By {article.author}
                </p>
                <p className="text-xs text-slate-400 font-medium">
                  Author Core Dispatch • {article.authorEmail || 'newsdesk@bossnews.com'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-slate-400 font-semibold text-xs uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(article.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {(article.views + 1).toLocaleString()} views
              </span>
            </div>
          </div>

          {/* Video Attachment embed mock */}
          {article.videoUrl && (
            <div className="mb-8 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl">
              <div className="aspect-video w-full flex items-center justify-center bg-cover bg-center opacity-75" style={{ backgroundImage: `url(${article.imageUrl})` }}>
                <div className="p-4 bg-slate-950/80 backdrop-blur-md rounded-2xl border border-slate-800 text-center max-w-sm">
                  <p className="text-sm font-bold text-white mb-1">Attached Premium Dispatch Media</p>
                  <p className="text-xs text-slate-400 mb-3">Live stream or static video reference is loaded via secure URL</p>
                  <a href={article.videoUrl} target="_blank" rel="noreferrer" className="inline-block px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg uppercase tracking-wider">
                    Open Media Stream
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* 3. ARTICLE CONTENT */}
          <div className="article-rich-text text-slate-800 dark:text-slate-200">
            {renderMarkdown(article.content)}
          </div>

          {/* 4. TAGS FOOTER & SHARE CONTROLS */}
          <div className="pt-8 border-t border-slate-100 dark:border-slate-800 mt-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Dispatch Tags:</span>
              {article.tags.map(tg => (
                <Link 
                  key={tg} 
                  to={`/?search=${encodeURIComponent(tg)}`} 
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  #{tg}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold rounded-full transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
                {shared ? 'URL Copied!' : 'Copy Link'}
              </button>
              
              <button 
                onClick={() => alert("Dispatch saved to your private terminal bookmarks.")}
                className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500"
                title="Bookmark article"
              >
                <Bookmark className="w-4 h-4" />
              </button>
            </div>
          </div>

        </motion.div>
      </div>

    </div>
  );
};

export default ArticlePage;
