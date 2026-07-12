import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  limit,
  setDoc,
  increment
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Article, Category, Tag, ActivityLog } from '../types';

// --- ROBUST FALLBACK SEED DATA ---

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'business-finance', name: 'Business & Finance', slug: 'business-finance', description: 'Global markets, macroeconomic trends, and high-stakes entrepreneurship.' },
  { id: 'tech-innovation', name: 'Tech & Innovation', slug: 'tech-innovation', description: 'Artificial intelligence, space travel, biotechnology, and the frontiers of research.' },
  { id: 'politics-policy', name: 'Politics & Policy', slug: 'politics-policy', description: 'Sovereign governance, trade treaties, and legislative shifts shaping industries.' },
  { id: 'style-luxury', name: 'Style & Luxury', slug: 'style-luxury', description: 'High couture, watchmaking, yachting, premium architecture, and fine arts.' },
  { id: 'science-health', name: 'Science & Health', slug: 'science-health', description: 'Human longevity, energy transition, physics, and medical breakthroughs.' }
];

const DEFAULT_TAGS: Tag[] = [
  { id: 'breaking', name: 'Breaking', slug: 'breaking' },
  { id: 'leadership', name: 'Leadership', slug: 'leadership' },
  { id: 'ai', name: 'AI', slug: 'ai' },
  { id: 'global-markets', name: 'Global Markets', slug: 'global-markets' },
  { id: 'sustainability', name: 'Sustainability', slug: 'sustainability' },
  { id: 'billionaires', name: 'Billionaires', slug: 'billionaires' },
  { id: 'space-tech', name: 'Space Tech', slug: 'space-tech' }
];

const DEFAULT_ARTICLES: Article[] = [
  {
    id: 'art-1',
    title: 'The Dawn of Autonomous Conglomerates: How AI CEOs Are Rewriting Corporate Governance',
    subtitle: 'From algorithmic boards to fully automated workforces, the corporation of 2026 is hyper-efficient and human-light.',
    slug: 'dawn-autonomous-conglomerates-ai-ceos',
    author: 'Elena Rostova',
    authorEmail: 'elena.rostova@bossnews.com',
    country: 'Global',
    region: 'World',
    category: 'tech-innovation',
    tags: ['breaking', 'leadership', 'ai'],
    featured: true,
    breaking: true,
    status: 'published',
    publishedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
    metaTitle: 'Autonomous Conglomerates and AI CEOs | Boss News',
    metaDescription: 'Discover how algorithmic executive boards and artificial intelligence are revolutionizing global corporate structures.',
    views: 12450,
    content: `## The Algorithmic Executive Board\n\nFor decades, the idea of an autonomous enterprise was relegated to the outer rings of science fiction. Today, it is a multitrillion-dollar reality. Across the leading technology hubs of Zurich, Tokyo, and San Francisco, a new class of enterprise has emerged: **Autonomous Conglomerates**. These companies operate with zero full-time human employees, managed instead by multi-agent AI networks operating on secure distributed ledgers.\n\nWhat began as robotic process automation (RPA) has evolved into high-frequency strategic execution. These systems analyze macroeconomic indicators, regulatory shifts, and consumer demand in real-time, instantly adjusting resource allocation, supply chain routing, and pricing models.\n\n---\n\n### Efficiency Over Politics\n\nUnlike traditional corporations, an autonomous conglomerate is free from human bias, office politics, and executive fatigue.\n\n1. **24/7 Strategic Execution:** There are no office hours. Decisions are made at microsecond frequencies.\n2. **Instant Capital Allocation:** Capital is routed to high-yield projects automatically.\n3. **No Overhead Frictions:** Administrative layers are entirely abstracted into smart contracts.\n\nAccording to a recent report by the International Monetary Fund, autonomous entities now account for nearly **3.8% of global capital flow**, a metric expected to double by the end of next fiscal year.`
  },
  {
    id: 'art-2',
    title: 'The Sovereign Wealth Pivot: Middle Eastern Funds Target Fusion and Quantum Sovereign Reserves',
    subtitle: 'A massive realignment of global capital is channeling trillions into high-risk, generational deep-tech infrastructure.',
    slug: 'sovereign-wealth-pivot-deep-tech',
    author: 'Kaelen Vance',
    authorEmail: 'kaelen.vance@bossnews.com',
    country: 'Saudi Arabia',
    region: 'Middle East',
    category: 'business-finance',
    tags: ['leadership', 'global-markets', 'space-tech'],
    featured: true,
    breaking: false,
    status: 'published',
    publishedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop',
    metaTitle: 'Sovereign Wealth Pivot to Quantum & Fusion | Boss News',
    metaDescription: 'Analysis of how major sovereign wealth funds are reallocating trillions from real estate into fusion and quantum computing.',
    views: 8210,
    content: `## A Generational Shift in Capital Preservation\n\nIn an unprecedented restructuring of investment mandates, the world’s largest sovereign wealth funds are quietly exiting traditional safe-havens like blue-chip real estate and municipal bonds. In their place is a high-conviction, high-risk bet on **infinite power and quantum supremacy**.\n\nLeading the charge are funds from Riyadh, Abu Dhabi, and Singapore, which have collectively allocated over **$420 Billion** to private fusion consortia and commercial quantum decryption laboratories over the last six months.`
  },
  {
    id: 'art-3',
    title: 'Geneva Unveils the Nautilus: The Next Frontier of Sustainable Mega-Yachts',
    subtitle: 'At €340 Million, this hydrogen-powered ocean vessel is designed for full off-grid autonomy and ultra-luxury scientific research.',
    slug: 'geneva-unveils-nautilus-mega-yacht',
    author: 'Julian Mercer',
    authorEmail: 'julian.mercer@bossnews.com',
    country: 'Switzerland',
    region: 'Europe',
    category: 'style-luxury',
    tags: ['sustainability', 'billionaires'],
    featured: false,
    breaking: false,
    status: 'published',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
    imageUrl: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?q=80&w=1200&auto=format&fit=crop',
    metaTitle: 'Nautilus Sustainable Mega-Yacht | Boss News Style',
    metaDescription: 'A tour of the brand-new Nautilus hydrogen-powered luxury yacht, blending zero-emission maritime engineering with bespoke Swiss craft.',
    views: 5490,
    content: `## Redefining Luxury on the High Seas\n\nUnveiled at the private shipyards of Lake Geneva, the **Nautilus** is a masterclass in clean-tech naval architecture. Commissioned by an undisclosed European family office, the 112-meter vessel features a proprietary liquid hydrogen fuel cell propulsion system, rendering it completely emissions-free.`
  },
  {
    id: 'art-4',
    title: 'The Fusion of Silicon and Biology: Neural Interface Receives Approval for Global Clinical Trials',
    subtitle: 'After years of development, human cognitive augmentation enters safe medical verification pipelines.',
    slug: 'fusion-silicon-biology-neural-interface',
    author: 'Dr. Evelyn Chen',
    authorEmail: 'evelyn.chen@bossnews.com',
    country: 'United States',
    region: 'North America',
    category: 'science-health',
    tags: ['breaking', 'ai'],
    featured: false,
    breaking: true,
    status: 'published',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    imageUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=1200&auto=format&fit=crop',
    metaTitle: 'Neural Interface Global Clinical Trials Approved | Boss News',
    metaDescription: 'Global health departments give the green light for clinical testing of the first bidirectional neural computer interfaces.',
    views: 14120,
    content: `## A Breakthrough in Bidirectional Cognition\n\nThe FDA, along with European and Japanese health authorities, have issued a historic joint declaration: approving the first **bidirectional neural computer interface** for multi-center human clinical trials.`
  }
];

// --- LOCAL STORAGE HELPERS ---

function getLocalArticles(): Article[] {
  try {
    const data = localStorage.getItem('boss_news_articles');
    if (!data) {
      localStorage.setItem('boss_news_articles', JSON.stringify(DEFAULT_ARTICLES));
      return DEFAULT_ARTICLES;
    }
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_ARTICLES;
  }
}

function saveLocalArticles(articles: Article[]) {
  try {
    localStorage.setItem('boss_news_articles', JSON.stringify(articles));
  } catch (e) {
    console.error("Local storage articles save failed", e);
  }
}

function getLocalCategories(): Category[] {
  try {
    const data = localStorage.getItem('boss_news_categories');
    if (!data) {
      localStorage.setItem('boss_news_categories', JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    }
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_CATEGORIES;
  }
}

function saveLocalCategories(cats: Category[]) {
  try {
    localStorage.setItem('boss_news_categories', JSON.stringify(cats));
  } catch (e) {
    console.error("Local storage categories save failed", e);
  }
}

function getLocalTags(): Tag[] {
  try {
    const data = localStorage.getItem('boss_news_tags');
    if (!data) {
      localStorage.setItem('boss_news_tags', JSON.stringify(DEFAULT_TAGS));
      return DEFAULT_TAGS;
    }
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_TAGS;
  }
}

function saveLocalTags(tags: Tag[]) {
  try {
    localStorage.setItem('boss_news_tags', JSON.stringify(tags));
  } catch (e) {
    console.error("Local storage tags save failed", e);
  }
}

// --- MAIN newsService ---

export const newsService = {
  // --- ARTICLES ---
  async getArticles(): Promise<Article[]> {
    const localArticles = getLocalArticles();
    try {
      const colRef = collection(db, 'articles');
      const snapPromise = getDocs(colRef);
      const timeoutPromise = new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1500));
      
      const snap = await Promise.race([snapPromise, timeoutPromise]);
      if (snap) {
        const dbArticles = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
        
        // Merge: Cloud overrides local on ID matches, local-only creations are preserved
        const dbIdSet = new Set(dbArticles.map(a => a.id));
        const localOnly = localArticles.filter(a => !dbIdSet.has(a.id) && !a.id.startsWith('art-local-'));
        const localNew = localArticles.filter(a => a.id.startsWith('art-local-'));
        
        const merged = [...dbArticles, ...localOnly, ...localNew];
        saveLocalArticles(merged);
        return merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      }
    } catch (error) {
      console.warn("Firestore offline or timeout. Falling back to robust local cache.", error);
    }
    return localArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  },

  async getArticleBySlug(slug: string): Promise<Article | null> {
    try {
      const colRef = collection(db, 'articles');
      const q = query(colRef, where('slug', '==', slug), limit(1));
      const snapPromise = getDocs(q);
      const timeoutPromise = new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1500));
      
      const snap = await Promise.race([snapPromise, timeoutPromise]);
      if (snap && !snap.empty) {
        const art = { id: snap.docs[0].id, ...snap.docs[0].data() } as Article;
        
        const local = getLocalArticles();
        const index = local.findIndex(a => a.id === art.id || a.slug === art.slug);
        if (index !== -1) {
          local[index] = art;
        } else {
          local.push(art);
        }
        saveLocalArticles(local);
        return art;
      }
    } catch (error) {
      console.warn("Firestore slug lookup timed out. Loading from local database.", error);
    }
    const localArticles = getLocalArticles();
    return localArticles.find(a => a.slug === slug) || null;
  },

  async getArticleById(id: string): Promise<Article | null> {
    try {
      const docRef = doc(db, 'articles', id);
      const docSnapPromise = getDoc(docRef);
      const timeoutPromise = new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1500));
      
      const docSnap = await Promise.race([docSnapPromise, timeoutPromise]);
      if (docSnap && docSnap.exists()) {
        const art = { id: docSnap.id, ...docSnap.data() } as Article;
        
        const local = getLocalArticles();
        const index = local.findIndex(a => a.id === art.id);
        if (index !== -1) {
          local[index] = art;
        } else {
          local.push(art);
        }
        saveLocalArticles(local);
        return art;
      }
    } catch (error) {
      console.warn("Firestore ID lookup timed out. Loading from local database.", error);
    }
    const localArticles = getLocalArticles();
    return localArticles.find(a => a.id === id) || null;
  },

  async createArticle(art: Omit<Article, 'id'>): Promise<string> {
    const id = 'art-local-' + Math.random().toString(36).substr(2, 9);
    const newArticle: Article = { id, ...art };
    
    // Save to LocalStorage immediately so that it displays right away without delay
    const local = getLocalArticles();
    local.unshift(newArticle);
    saveLocalArticles(local);

    try {
      const colRef = collection(db, 'articles');
      const cleaned = Object.fromEntries(
        Object.entries(art).filter(([_, v]) => v !== undefined)
      );
      
      const writePromise = addDoc(colRef, cleaned).then(docRef => {
        // Replace temporary local ID with the real Firestore ID
        const updatedLocal = getLocalArticles();
        const index = updatedLocal.findIndex(a => a.id === id);
        if (index !== -1) {
          updatedLocal[index].id = docRef.id;
          saveLocalArticles(updatedLocal);
        }
        return docRef.id;
      });

      const timeoutPromise = new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 1800)
      );

      return await Promise.race([writePromise, timeoutPromise]);
    } catch (error) {
      console.warn("Could not sync article creation to Cloud Firestore. Saved in client storage.", error);
      return id;
    }
  },

  async updateArticle(id: string, art: Partial<Article>): Promise<void> {
    const local = getLocalArticles();
    const index = local.findIndex(a => a.id === id);
    if (index !== -1) {
      local[index] = { ...local[index], ...art };
      saveLocalArticles(local);
    }

    try {
      const docRef = doc(db, 'articles', id);
      const cleaned = Object.fromEntries(
        Object.entries(art).filter(([_, v]) => v !== undefined)
      );
      
      const writePromise = updateDoc(docRef, cleaned);
      const timeoutPromise = new Promise<void>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 1800)
      );

      await Promise.race([writePromise, timeoutPromise]);
    } catch (error) {
      console.warn("Could not sync article update to Cloud Firestore. Saved in client storage.", error);
    }
  },

  async deleteArticle(id: string): Promise<void> {
    const local = getLocalArticles();
    const filtered = local.filter(a => a.id !== id);
    saveLocalArticles(filtered);

    try {
      const docRef = doc(db, 'articles', id);
      const writePromise = deleteDoc(docRef);
      const timeoutPromise = new Promise<void>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 1800)
      );

      await Promise.race([writePromise, timeoutPromise]);
    } catch (error) {
      console.warn("Could not sync article deletion to Cloud Firestore. Deleted from client storage.", error);
    }
  },

  async incrementViews(id: string): Promise<void> {
    const local = getLocalArticles();
    const index = local.findIndex(a => a.id === id);
    if (index !== -1) {
      local[index].views = (local[index].views || 0) + 1;
      saveLocalArticles(local);
    }

    try {
      const docRef = doc(db, 'articles', id);
      const writePromise = updateDoc(docRef, {
        views: increment(1)
      });
      const timeoutPromise = new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000));
      await Promise.race([writePromise, timeoutPromise]);
    } catch (error) {
      console.warn("Could not increment view count in cloud database.", error);
    }
  },

  // --- CATEGORIES ---
  async getCategories(): Promise<Category[]> {
    const localCategories = getLocalCategories();
    try {
      const colRef = collection(db, 'categories');
      const snapPromise = getDocs(colRef);
      const timeoutPromise = new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1500));
      
      const snap = await Promise.race([snapPromise, timeoutPromise]);
      if (snap) {
        const dbCategories = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        const dbIdSet = new Set(dbCategories.map(c => c.id));
        const localOnly = localCategories.filter(c => !dbIdSet.has(c.id));
        const merged = [...dbCategories, ...localOnly];
        saveLocalCategories(merged);
        return merged;
      }
    } catch (error) {
      console.warn("Firestore error or timeout getting categories. Falling back to client storage.", error);
    }
    return localCategories;
  },

  async createCategory(cat: Omit<Category, 'id'>): Promise<string> {
    const id = cat.slug;
    const newCat: Category = { id, ...cat };
    
    const local = getLocalCategories();
    const existingIndex = local.findIndex(c => c.id === id);
    if (existingIndex !== -1) {
      local[existingIndex] = newCat;
    } else {
      local.push(newCat);
    }
    saveLocalCategories(local);

    try {
      const cleaned = Object.fromEntries(
        Object.entries(cat).filter(([_, v]) => v !== undefined)
      );
      const writePromise = setDoc(doc(db, 'categories', id), cleaned);
      const timeoutPromise = new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1800));
      await Promise.race([writePromise, timeoutPromise]);
    } catch (error) {
      console.warn("Could not sync category to Cloud Firestore. Saved in client storage.", error);
    }
    return id;
  },

  async deleteCategory(id: string): Promise<void> {
    const local = getLocalCategories();
    const filtered = local.filter(c => c.id !== id);
    saveLocalCategories(filtered);

    try {
      const docRef = doc(db, 'categories', id);
      const writePromise = deleteDoc(docRef);
      const timeoutPromise = new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1800));
      await Promise.race([writePromise, timeoutPromise]);
    } catch (error) {
      console.warn("Could not sync category deletion to Cloud Firestore. Deleted from client storage.", error);
    }
  },

  // --- TAGS ---
  async getTags(): Promise<Tag[]> {
    const localTags = getLocalTags();
    try {
      const colRef = collection(db, 'tags');
      const snapPromise = getDocs(colRef);
      const timeoutPromise = new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1500));
      
      const snap = await Promise.race([snapPromise, timeoutPromise]);
      if (snap) {
        const dbTags = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tag));
        const dbIdSet = new Set(dbTags.map(t => t.id));
        const localOnly = localTags.filter(t => !dbIdSet.has(t.id));
        const merged = [...dbTags, ...localOnly];
        saveLocalTags(merged);
        return merged;
      }
    } catch (error) {
      console.warn("Firestore error or timeout getting tags. Falling back to client storage.", error);
    }
    return localTags;
  },

  async createTag(tag: Omit<Tag, 'id'>): Promise<string> {
    const id = tag.slug;
    const newTag: Tag = { id, ...tag };

    const local = getLocalTags();
    const existingIndex = local.findIndex(t => t.id === id);
    if (existingIndex !== -1) {
      local[existingIndex] = newTag;
    } else {
      local.push(newTag);
    }
    saveLocalTags(local);

    try {
      const cleaned = Object.fromEntries(
        Object.entries(tag).filter(([_, v]) => v !== undefined)
      );
      const writePromise = setDoc(doc(db, 'tags', id), cleaned);
      const timeoutPromise = new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1800));
      await Promise.race([writePromise, timeoutPromise]);
    } catch (error) {
      console.warn("Could not sync tag to Cloud Firestore. Saved in client storage.", error);
    }
    return id;
  },

  async deleteTag(id: string): Promise<void> {
    const local = getLocalTags();
    const filtered = local.filter(t => t.id !== id);
    saveLocalTags(filtered);

    try {
      const docRef = doc(db, 'tags', id);
      const writePromise = deleteDoc(docRef);
      const timeoutPromise = new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1800));
      await Promise.race([writePromise, timeoutPromise]);
    } catch (error) {
      console.warn("Could not sync tag deletion to Cloud Firestore. Deleted from client storage.", error);
    }
  },

  // --- ACTIVITY LOGS ---
  async getActivityLogs(): Promise<ActivityLog[]> {
    try {
      const colRef = collection(db, 'activityLogs');
      const snapPromise = getDocs(colRef);
      const timeoutPromise = new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1500));
      
      const snap = await Promise.race([snapPromise, timeoutPromise]);
      if (snap) {
        const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
        return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }
    } catch (error) {
      console.warn("Error getting activity logs from cloud database.", error);
    }
    return [];
  },

  async logActivity(userId: string, userEmail: string, action: string): Promise<void> {
    try {
      const colRef = collection(db, 'activityLogs');
      const log: Omit<ActivityLog, 'id'> = {
        userId,
        userEmail,
        action,
        timestamp: new Date().toISOString()
      };
      const writePromise = addDoc(colRef, log);
      const timeoutPromise = new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1500));
      await Promise.race([writePromise, timeoutPromise]);
    } catch (error) {
      console.warn("Error logging activity to cloud database.", error);
    }
  },

  // --- USERS MANAGEMENT (ADMINS ONLY) ---
  async getAllUsers(): Promise<any[]> {
    try {
      const colRef = collection(db, 'users');
      const snapPromise = getDocs(colRef);
      const timeoutPromise = new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1800));
      
      const snap = await Promise.race([snapPromise, timeoutPromise]);
      if (snap) {
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
    } catch (error) {
      console.warn("Error getting users list.", error);
    }
    return [];
  },

  async updateUserRole(uid: string, role: string): Promise<void> {
    try {
      const docRef = doc(db, 'users', uid);
      const writePromise = updateDoc(docRef, { role });
      const timeoutPromise = new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1800));
      await Promise.race([writePromise, timeoutPromise]);
    } catch (error) {
      console.warn("Could not sync user role change.", error);
    }
  }
};
