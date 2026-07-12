import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Tag as TagIcon, 
  Phone, 
  Mail, 
  MessageSquare, 
  ExternalLink, 
  Search, 
  Filter, 
  Sparkles, 
  CheckCircle,
  X,
  PlusCircle,
  Globe,
  Info
} from 'lucide-react';
import { productService } from '../services/productService';
import { Product } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Marketplace: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Load products
  useEffect(() => {
    const fetchProds = async () => {
      try {
        const data = await productService.getProducts();
        // filter only available or sold products for the public marketplace
        setProducts(data.filter(p => p.status !== 'archived'));
      } catch (err) {
        console.error("Failed to fetch products", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProds();
  }, []);

  const categories = ['All', 'Electronics & Comm Tech', 'Sovereign Intel & Reports', 'Luxury Goods & Services', 'Other'];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getWhatsAppLink = (prod: Product) => {
    const phoneClean = (prod.sellerWhatsApp || prod.sellerPhone || '+231889792996').replace(/[^0-9+]/g, '');
    const message = `Hello, I saw your product "${prod.title}" on BOSS.NEWS Marketplace and am interested in procuring it. Could you provide more details? Thank you.`;
    return `https://wa.me/${phoneClean.replace('+', '')}?text=${encodeURIComponent(message)}`;
  };

  const getPhoneLink = (prod: Product) => {
    const phoneClean = (prod.sellerPhone || '+231889792996').replace(/\s+/g, '');
    return `tel:${phoneClean}`;
  };

  const getEmailLink = (prod: Product) => {
    const email = prod.sellerEmail || 'aki.sokpah.link@gmail.com';
    const subject = `BOSS.NEWS Marketplace Inquiry: ${prod.title}`;
    const body = `Dear Seller,\n\nI am contacting you regarding your listing for "${prod.title}" priced at ${prod.currency} ${prod.price.toLocaleString()}.\n\nSincerely,\n`;
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen pb-20 transition-colors duration-300">
      
      {/* Premium Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-violet-950 text-white py-16 md:py-24 border-b border-violet-900/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.15),transparent_60%)]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-violet-500/20 text-violet-300 border border-violet-500/30 uppercase tracking-widest mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Elite Asset Procurement
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight uppercase leading-none mb-6">
              BOSS<span className="text-violet-400">.MARKETPLACE</span>
            </h1>
            <p className="text-lg text-slate-300 font-medium leading-relaxed mb-8">
              Sovereign intel reports, high-grade encrypted telecommunication hardware, and luxury secure assets listed directly by vetted intelligence providers and private desks worldwide.
            </p>
            
            <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-300">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md">
                <CheckCircle className="w-4 h-4 text-violet-400" /> Escrow Verified Listings
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md">
                <Globe className="w-4 h-4 text-violet-400" /> Global Dispatch Available
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Global Escrow & Contact Highlight Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 dark:bg-violet-400/5 rounded-full blur-2xl"></div>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/25">Vetted Desk</span>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Secure Global Escrow & Procurement Desk</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
                Transactions are authorized and secured by global builder and escrow partner <strong className="text-slate-950 dark:text-white">Akin S. Sokpah</strong>. For bulk contracts, bespoke requests, or listing placements, contact our secure line directly.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <a 
                href="https://wa.me/231889792996" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition-all active:scale-95"
              >
                <MessageSquare className="w-4 h-4" /> WhatsApp Secure
              </a>
              <a 
                href="tel:+231889792996"
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs rounded-xl transition-all"
              >
                <Phone className="w-4 h-4" /> Call Desk
              </a>
              <a 
                href="mailto:aki.sokpah.link@gmail.com"
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs rounded-xl transition-all"
              >
                <Mail className="w-4 h-4" /> Email Procurement
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Browse Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200 dark:border-slate-900">
          
          {/* Quick Category Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat 
                    ? 'bg-violet-600 dark:bg-violet-500 text-white shadow-lg shadow-violet-500/25' 
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-750'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search assets and intel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 pr-4 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:text-white transition-all placeholder:text-slate-400"
            />
            <Search className="absolute left-3.5 top-2.5 w-4.5 h-4.5 text-slate-400" />
          </div>

        </div>

        {/* Loading / Empty States */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm font-semibold text-slate-400">Accessing secure catalog databases...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 mt-8">
            <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <p className="font-extrabold text-lg text-slate-800 dark:text-slate-200 mb-1">No Listings Found</p>
            <p className="text-sm text-slate-400 max-w-md mx-auto">There are currently no assets listed matching your query or selected category filter. Please try a different category or query.</p>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
            {filteredProducts.map((prod) => (
              <motion.div
                key={prod.id}
                layoutId={`card-${prod.id}`}
                onClick={() => setSelectedProduct(prod)}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl dark:hover:border-slate-700 transition-all cursor-pointer flex flex-col h-full"
              >
                {/* Product Image */}
                <div className="aspect-video w-full bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
                  {prod.imageUrl ? (
                    <img 
                      src={prod.imageUrl} 
                      alt={prod.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-800">
                      <ShoppingBag className="w-12 h-12" />
                    </div>
                  )}

                  {/* Price Tag */}
                  <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md text-white font-black text-sm px-3.5 py-1.5 rounded-xl border border-white/10 shadow-lg">
                    {prod.currency} {prod.price.toLocaleString()}
                  </div>

                  {/* Status Overlay */}
                  {prod.status === 'sold' && (
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center">
                      <span className="px-5 py-2 bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-full border border-red-500 shadow-xl">
                        PROCURMENT COMPLETED • SOLD
                      </span>
                    </div>
                  )}

                  {/* Condition Tag */}
                  <div className="absolute top-4 right-4 bg-violet-600 dark:bg-violet-500 text-white font-black text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full border border-violet-400/20">
                    {prod.condition === 'new' && 'New'}
                    {prod.condition === 'used' && 'Used'}
                    {prod.condition === 'refurbished' && 'Refurbished'}
                    {prod.condition === 'not_applicable' && 'Asset'}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="text-[10px] text-violet-600 dark:text-violet-400 font-extrabold uppercase tracking-widest mb-2">
                    {prod.category}
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white line-clamp-1 mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {prod.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2 leading-relaxed mb-4 flex-grow">
                    {prod.description}
                  </p>

                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span className="truncate max-w-[150px]">By {prod.sellerName}</span>
                    <span className="text-violet-600 dark:text-violet-400 flex items-center gap-1 group-hover:underline">
                      Procure Asset <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Expanded Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            ></motion.div>

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              layoutId={`card-${selectedProduct.id}`}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl overflow-hidden shadow-2xl relative w-full max-w-3xl z-10 max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-950/60 hover:bg-slate-950/80 text-white border border-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Top Image Banner */}
              <div className="h-64 sm:h-80 w-full bg-slate-100 dark:bg-slate-950 relative">
                {selectedProduct.imageUrl ? (
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-850">
                    <ShoppingBag className="w-20 h-20" />
                  </div>
                )}

                {/* Price tag */}
                <div className="absolute bottom-6 left-6 bg-slate-950/90 backdrop-blur-md text-white font-black text-xl px-4.5 py-2.5 rounded-xl border border-white/10 shadow-2xl">
                  {selectedProduct.currency} {selectedProduct.price.toLocaleString()}
                </div>

                {/* Condition Tag */}
                <div className="absolute top-4 left-4 bg-violet-600 dark:bg-violet-500 text-white font-black text-xs uppercase tracking-widest px-3 py-1 rounded-full border border-violet-400/20">
                  {selectedProduct.condition === 'new' && 'New Asset'}
                  {selectedProduct.condition === 'used' && 'Used / Operational'}
                  {selectedProduct.condition === 'refurbished' && 'Refurbished'}
                  {selectedProduct.condition === 'not_applicable' && 'Asset'}
                </div>
              </div>

              {/* Body */}
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <span className="text-xs font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest block mb-2">
                    {selectedProduct.category}
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">
                    {selectedProduct.title}
                  </h2>
                </div>

                {/* Description */}
                <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium space-y-4">
                  <p>{selectedProduct.description}</p>
                </div>

                {/* Logistics Disclaimer */}
                <div className="p-4 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-900 text-xs font-semibold text-slate-500 dark:text-slate-400 flex gap-3">
                  <Info className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-900 dark:text-white font-bold block mb-1">Escrow & Secure Logistics Escort</span>
                    Dispatch and transaction validation are cleared through our secure broker desks under the supervision of Akin S. Sokpah. All details are kept confidential.
                  </div>
                </div>

                {/* Contact Seller Panel */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                    Authorized Broker & Procurement Contact
                  </h4>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-extrabold text-slate-900 dark:text-white text-base">
                        {selectedProduct.sellerName}
                      </p>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Security Broker ID: {selectedProduct.id.substr(0, 10).toUpperCase()}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      <a
                        href={getWhatsAppLink(selectedProduct)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition-all active:scale-95"
                      >
                        <MessageSquare className="w-4 h-4" /> WhatsApp
                      </a>
                      <a
                        href={getPhoneLink(selectedProduct)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs rounded-xl transition-all"
                      >
                        <Phone className="w-4 h-4" /> Call Broker
                      </a>
                      <a
                        href={getEmailLink(selectedProduct)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs rounded-xl transition-all"
                      >
                        <Mail className="w-4 h-4" /> Email Inquiry
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Marketplace;
