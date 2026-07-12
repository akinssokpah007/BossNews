import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 py-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Brand section */}
        <div className="md:col-span-1 space-y-4">
          <Link to="/" className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">
            BOSS<span className="text-violet-600 dark:text-violet-400">.NEWS</span>
          </Link>
          <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
            The world's premier platform for high-impact global reporting, strategic corporate intelligence, and futuristic breakthrough news.
          </p>
          <div className="flex gap-4 pt-2">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">
              Est. 2026 • Live Worldwide
            </span>
          </div>
        </div>

        {/* Global Sections */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white mb-4">
            Coverage
          </h4>
          <ul className="space-y-2 text-sm font-semibold">
            <li>
              <Link to="/world" className="hover:text-violet-500 transition-colors">
                World News
              </Link>
            </li>
            <li>
              <Link to="/category/business-finance" className="hover:text-violet-500 transition-colors">
                Business & Finance
              </Link>
            </li>
            <li>
              <Link to="/category/tech-innovation" className="hover:text-violet-500 transition-colors">
                Tech & Innovation
              </Link>
            </li>
            <li>
              <Link to="/category/style-luxury" className="hover:text-violet-500 transition-colors">
                Style & Luxury
              </Link>
            </li>
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white mb-4">
            Regions
          </h4>
          <ul className="space-y-2 text-sm font-semibold">
            <li>
              <Link to="/world?region=North%20America" className="hover:text-violet-500 transition-colors">
                North America
              </Link>
            </li>
            <li>
              <Link to="/world?region=Europe" className="hover:text-violet-500 transition-colors">
                Europe
              </Link>
            </li>
            <li>
              <Link to="/world?region=Asia" className="hover:text-violet-500 transition-colors">
                Asia
              </Link>
            </li>
            <li>
              <Link to="/world?region=Middle%20East" className="hover:text-violet-500 transition-colors">
                Middle East
              </Link>
            </li>
          </ul>
        </div>

        {/* Corporate / Contact */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white mb-4">
            Intel & Escrow Desk
          </h4>
          <ul className="space-y-2.5 text-sm font-semibold">
            <li className="flex items-center gap-2">
              <Mail className="w-4.5 h-4.5 text-slate-400" />
              <span>intel@bossnews.com</span>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="w-4.5 h-4.5 text-slate-400" />
              <span>Geneva, Switzerland</span>
            </li>
            <li className="border-t border-slate-200 dark:border-slate-900 my-2 pt-2 text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest">
              Developer & Procurement
            </li>
            <li className="text-xs text-slate-900 dark:text-white font-extrabold">
              Akin S. Sokpah
            </li>
            <li className="flex items-center gap-2 text-xs">
              <Phone className="w-4 h-4 text-violet-500" />
              <a href="tel:+231889792996" className="hover:text-violet-500 transition-colors">+231 88 979 2996</a>
            </li>
            <li className="flex items-center gap-2 text-xs">
              <Mail className="w-4 h-4 text-violet-500" />
              <a href="mailto:aki.sokpah.link@gmail.com" className="hover:text-violet-500 transition-colors">aki.sokpah.link@gmail.com</a>
            </li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-200 dark:border-slate-900 text-center text-xs font-semibold text-slate-400 space-y-2">
        <p>© {new Date().getFullYear()} BOSS.NEWS Global Media Inc. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
