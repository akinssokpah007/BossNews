import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { newsService } from '../services/newsService';
import { productService } from '../services/productService';
import { Article, Category, Tag, UserProfile, UserRole, ActivityLog, Product } from '../types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db } from '../lib/firebase';
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash, 
  FileText, 
  FolderPlus, 
  Tags, 
  Users, 
  Activity, 
  Image as ImageIcon, 
  Video, 
  Eye, 
  Check, 
  X, 
  Sparkles, 
  Clock, 
  KeyRound, 
  AlertTriangle,
  LogOut,
  Upload,
  ExternalLink,
  Cloud,
  HardDrive,
  ShoppingBag
} from 'lucide-react';

type AdminTab = 'overview' | 'articles' | 'categories' | 'roles' | 'logs' | 'backup' | 'marketplace';

const AdminDashboard: React.FC = () => {
  const { user, userProfile, signIn, signUp, signOut, googleDriveToken, connectGoogleDrive, loading: authLoading } = useAuth();
  
  // Login Form States
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');

  // Active Admin States
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [productsList, setProductsList] = useState<Product[]>([]);

  // Form State for Adding / Editing Products
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [productFormId, setProductFormId] = useState<string | null>(null);
  const [prodTitle, setProdTitle] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodPrice, setProdPrice] = useState<number>(0);
  const [prodCurrency, setProdCurrency] = useState('USD');
  const [prodCategory, setProdCategory] = useState('Electronics & Comm Tech');
  const [prodCondition, setProdCondition] = useState<'new' | 'used' | 'refurbished' | 'not_applicable'>('new');
  const [prodSellerName, setProdSellerName] = useState('Akin S. Sokpah');
  const [prodSellerPhone, setProdSellerPhone] = useState('+231889792996');
  const [prodSellerWhatsApp, setProdSellerWhatsApp] = useState('+231889792996');
  const [prodSellerEmail, setProdSellerEmail] = useState('aki.sokpah.link@gmail.com');
  const [prodStatus, setProdStatus] = useState<'available' | 'sold' | 'archived'>('available');
  const [prodImageUrl, setProdImageUrl] = useState('');

  // Backup states
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupResult, setBackupResult] = useState<{ fileId: string; fileName: string; link: string } | null>(null);

  // Form State for Adding / Editing Articles
  const [isEditingArticle, setIsEditingArticle] = useState(false);
  const [articleFormId, setArticleFormId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [country, setCountry] = useState('Global');
  const [region, setRegion] = useState('World');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);
  const [breaking, setBreaking] = useState(false);
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled'>('draft');
  const [scheduledAt, setScheduledAt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  
  // Media Upload State
  const [uploadProgress, setUploadProgress] = useState(false);
  const [uploadType, setUploadType] = useState<'image' | 'video'>('image');

  // Category and Tag Quick Creation States
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagSlug, setNewTagSlug] = useState('');

  // Loader & Alert states for CRUD
  const [actionLoading, setActionLoading] = useState(false);
  const [crudError, setCrudError] = useState('');
  const [crudSuccess, setCrudSuccess] = useState('');

  // Auto generate slug from title
  useEffect(() => {
    if (!articleFormId) {
      const generated = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      setSlug(generated);
    }
  }, [title, articleFormId]);

  // Load all dashboard collections
  const loadDashboardData = async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const arts = await newsService.getArticles();
      setArticles(arts);

      const cats = await newsService.getCategories();
      setCategories(cats);
      if (cats.length > 0 && !selectedCategory) {
        setSelectedCategory(cats[0].slug);
      }

      const tgs = await newsService.getTags();
      setTags(tgs);

      const activityLogs = await newsService.getActivityLogs();
      setLogs(activityLogs);

      const prods = await productService.getProducts();
      setProductsList(prods);

      if (userProfile?.role === 'admin') {
        const usrs = await newsService.getAllUsers();
        setUsersList(usrs);
      }
    } catch (err) {
      console.error("Error loading dashboard collections:", err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (user && userProfile) {
      loadDashboardData();
    }
  }, [user, userProfile]);

  const handleExportToDrive = async () => {
    setBackupLoading(true);
    setCrudError('');
    setCrudSuccess('');
    try {
      let token = googleDriveToken;
      if (!token) {
        token = await connectGoogleDrive();
      }

      const response = await fetch('/api/export-to-drive', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to complete export sequence.');
      }

      const data = await response.json();
      setBackupResult(data);
      setCrudSuccess('Codebase successfully compiled and backed up to Google Drive!');
      await newsService.logActivity(user!.uid, user!.email!, `Backed up codebase to Google Drive: "${data.fileName}"`);
    } catch (err: any) {
      console.error('Backup error:', err);
      setCrudError(err.message || 'An error occurred during codebase compilation.');
    } finally {
      setBackupLoading(false);
    }
  };

  // Handle Login submission
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');
    try {
      if (isRegistering) {
        if (!displayName) {
          setAuthError('Display Name is required for core profile generation.');
          return;
        }
        await signUp(email, password, displayName);
        setAuthSuccessMsg('Registration successful. Admin parameters assigned!');
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      console.error(err);
      let errorMsg = err.message || 'Authentication sequence aborted. Check credentials.';
      const errorCode = err.code || '';
      
      if (errorCode === 'auth/email-already-in-use' || errorMsg.includes('email-already-in-use') || errorMsg.includes('auth/email-already-in-use')) {
        errorMsg = 'This email address is already registered. Please switch to "Sign In" instead of registering a new profile.';
      } else if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/wrong-password' || errorMsg.includes('wrong-password') || errorMsg.includes('invalid-credential')) {
        errorMsg = 'Invalid credentials. Please verify your email and password sequence.';
      } else if (errorCode === 'auth/user-not-found' || errorMsg.includes('user-not-found')) {
        errorMsg = 'No security profile found matching this email. Register a new terminal profile.';
      } else if (errorCode === 'auth/weak-password' || errorMsg.includes('weak-password')) {
        errorMsg = 'The encryption key (password) is too weak. Please use at least 6 characters.';
      } else if (errorCode === 'auth/invalid-email' || errorMsg.includes('invalid-email')) {
        errorMsg = 'The email address format is invalid. Please enter a valid email.';
      }
      
      setAuthError(errorMsg);
    }
  };

  // Media upload handler (resilient, with automatic Base64 local fallback)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadProgress(true);
    try {
      // Attempt Firebase Storage Upload
      const storageRef = ref(storage, `media/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      
      if (uploadType === 'image') setImageUrl(url);
      else setVideoUrl(url);
      
      setCrudSuccess(`Media successfully uploaded to secure cloud bucket: ${file.name}`);
    } catch (err) {
      console.warn("Storage bucket not provisioned or active, executing base64 pipeline fallback:", err);
      // Fallback: Read local Base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Url = reader.result as string;
        if (uploadType === 'image') setImageUrl(base64Url);
        else setVideoUrl(base64Url);
        setCrudSuccess(`Uploaded locally. Media loaded successfully as sandbox data.`);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadProgress(false);
    }
  };

  // Article Edit initiation
  const handleEditArticleClick = (art: Article) => {
    setArticleFormId(art.id);
    setTitle(art.title);
    setSubtitle(art.subtitle || '');
    setSlug(art.slug);
    setContent(art.content);
    setAuthor(art.author);
    setCountry(art.country);
    setRegion(art.region);
    setSelectedCategory(art.category);
    setSelectedTags(art.tags);
    setFeatured(art.featured);
    setBreaking(art.breaking);
    setStatus(art.status);
    setScheduledAt(art.scheduledAt || '');
    setImageUrl(art.imageUrl || '');
    setVideoUrl(art.videoUrl || '');
    setMetaTitle(art.metaTitle || '');
    setMetaDescription(art.metaDescription || '');
    setIsEditingArticle(true);
  };

  // Reset Form
  const resetArticleForm = () => {
    setArticleFormId(null);
    setTitle('');
    setSubtitle('');
    setSlug('');
    setContent('');
    setAuthor(userProfile?.displayName || 'Editorial Desk');
    setCountry('Global');
    setRegion('World');
    if (categories.length > 0) setSelectedCategory(categories[0].slug);
    setSelectedTags([]);
    setFeatured(false);
    setBreaking(false);
    setStatus('draft');
    setScheduledAt('');
    setImageUrl('');
    setVideoUrl('');
    setMetaTitle('');
    setMetaDescription('');
    setIsEditingArticle(false);
    setCrudError('');
    setCrudSuccess('');
  };

  // Article Save / Update
  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !selectedCategory) {
      setCrudError('Title, Category, and Article Content are mandatory.');
      return;
    }
    setActionLoading(true);
    setCrudError('');
    setCrudSuccess('');

    const payload: Omit<Article, 'id'> = {
      title,
      subtitle,
      slug,
      content,
      author: author || userProfile?.displayName || 'Newsroom',
      authorEmail: user?.email || '',
      country,
      region,
      category: selectedCategory,
      tags: selectedTags,
      featured,
      breaking,
      status,
      publishedAt: status === 'published' ? new Date().toISOString() : (articleFormId ? articles.find(a => a.id === articleFormId)?.publishedAt || new Date().toISOString() : new Date().toISOString()),
      scheduledAt: status === 'scheduled' ? scheduledAt : undefined,
      imageUrl,
      videoUrl,
      metaTitle: metaTitle || `${title} | Boss News`,
      metaDescription: metaDescription || subtitle,
      views: articleFormId ? articles.find(a => a.id === articleFormId)?.views || 0 : 0
    };

    const timeoutPromise = (ms: number) => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Operational Timeout: The cloud firestore write request took longer than 8 seconds. Please check your network connectivity, refresh the page, or ensure your user session is authorized.')), ms)
      );

    try {
      if (articleFormId) {
        // Update
        await Promise.race([
          newsService.updateArticle(articleFormId, payload),
          timeoutPromise(8000)
        ]);
        await newsService.logActivity(user!.uid, user!.email!, `Updated Article: "${title}"`);
        setCrudSuccess('Article details updated and dispatched to Firestore.');
      } else {
        // Create
        await Promise.race([
          newsService.createArticle(payload),
          timeoutPromise(8000)
        ]);
        await newsService.logActivity(user!.uid, user!.email!, `Published New Article: "${title}"`);
        setCrudSuccess('New article successfully published and added to cloud nodes.');
      }
      setTimeout(() => {
        resetArticleForm();
        loadDashboardData();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setCrudError(err.message || 'Operation failed. Verify database connectivity.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Article
  const handleDeleteArticle = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be reversed.`)) return;
    setActionLoading(true);
    try {
      await newsService.deleteArticle(id);
      await newsService.logActivity(user!.uid, user!.email!, `Deleted Article: "${name}"`);
      setCrudSuccess(`Successfully purged article.`);
      loadDashboardData();
    } catch (err: any) {
      setCrudError(err.message || 'Purging failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // --- MARKETPLACE PRODUCTS CRUD ACTIONS ---

  const resetProductForm = () => {
    setProductFormId(null);
    setProdTitle('');
    setProdDescription('');
    setProdPrice(0);
    setProdCurrency('USD');
    setProdCategory('Electronics & Comm Tech');
    setProdCondition('new');
    setProdSellerName('Akin S. Sokpah');
    setProdSellerPhone('+231889792996');
    setProdSellerWhatsApp('+231889792996');
    setProdSellerEmail('aki.sokpah.link@gmail.com');
    setProdStatus('available');
    setProdImageUrl('');
    setIsEditingProduct(false);
    setCrudError('');
    setCrudSuccess('');
  };

  const handleEditProductClick = (prod: Product) => {
    setProductFormId(prod.id);
    setProdTitle(prod.title);
    setProdDescription(prod.description);
    setProdPrice(prod.price);
    setProdCurrency(prod.currency || 'USD');
    setProdCategory(prod.category);
    setProdCondition(prod.condition || 'new');
    setProdSellerName(prod.sellerName || 'Akin S. Sokpah');
    setProdSellerPhone(prod.sellerPhone || '+231889792996');
    setProdSellerWhatsApp(prod.sellerWhatsApp || '+231889792996');
    setProdSellerEmail(prod.sellerEmail || 'aki.sokpah.link@gmail.com');
    setProdStatus(prod.status || 'available');
    setProdImageUrl(prod.imageUrl || '');
    setIsEditingProduct(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodTitle || !prodDescription || prodPrice === undefined || !prodCategory) {
      setCrudError('Product Title, Price, Category, and Description are mandatory.');
      return;
    }
    setActionLoading(true);
    setCrudError('');
    setCrudSuccess('');

    const payload: Omit<Product, 'id'> = {
      title: prodTitle,
      description: prodDescription,
      price: Number(prodPrice),
      currency: prodCurrency,
      category: prodCategory,
      condition: prodCondition,
      sellerName: prodSellerName || 'Akin S. Sokpah',
      sellerPhone: prodSellerPhone || '+231889792996',
      sellerWhatsApp: prodSellerWhatsApp || '+231889792996',
      sellerEmail: prodSellerEmail || 'aki.sokpah.link@gmail.com',
      status: prodStatus,
      imageUrl: prodImageUrl,
      createdAt: productFormId ? (productsList.find(p => p.id === productFormId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
    };

    try {
      if (productFormId) {
        // Update
        await productService.updateProduct(productFormId, payload);
        await newsService.logActivity(user!.uid, user!.email!, `Updated Product listing: "${prodTitle}"`);
        setCrudSuccess('Product listing updated successfully.');
      } else {
        // Create
        await productService.createProduct(payload);
        await newsService.logActivity(user!.uid, user!.email!, `Created Product listing: "${prodTitle}"`);
        setCrudSuccess('New product successfully listed on the marketplace.');
      }
      setTimeout(() => {
        resetProductForm();
        loadDashboardData();
      }, 800);
    } catch (err: any) {
      console.error(err);
      setCrudError(err.message || 'Product action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to remove "${title}"?`)) return;
    setActionLoading(true);
    try {
      await productService.deleteProduct(id);
      await newsService.logActivity(user!.uid, user!.email!, `Deleted product: "${title}"`);
      setCrudSuccess(`Product listing purged successfully.`);
      loadDashboardData();
    } catch (err: any) {
      setCrudError(err.message || 'Failed to delete product.');
    } finally {
      setActionLoading(false);
    }
  };

  // Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !newCatSlug) return;
    setActionLoading(true);
    try {
      await newsService.createCategory({
        name: newCatName,
        slug: newCatSlug
      });
      await newsService.logActivity(user!.uid, user!.email!, `Created Category: "${newCatName}"`);
      setNewCatName('');
      setNewCatSlug('');
      setCrudSuccess('Category Node Registered.');
      loadDashboardData();
    } catch (err: any) {
      setCrudError(err.message || 'Failed creating category.');
    } finally {
      setActionLoading(false);
    }
  };

  // Create Tag
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName || !newTagSlug) return;
    setActionLoading(true);
    try {
      await newsService.createTag({
        name: newTagName,
        slug: newTagSlug
      });
      await newsService.logActivity(user!.uid, user!.email!, `Created Tag: "${newTagName}"`);
      setNewTagName('');
      setNewTagSlug('');
      setCrudSuccess('Tag Node Registered.');
      loadDashboardData();
    } catch (err: any) {
      setCrudError(err.message || 'Failed creating tag.');
    } finally {
      setActionLoading(false);
    }
  };

  // Update User Role (Admin only)
  const handleRoleUpdate = async (uid: string, targetRole: UserRole, targetEmail: string) => {
    if (userProfile?.role !== 'admin') {
      alert("Unauthorized. Only high-clearance admins can alter roles.");
      return;
    }
    setActionLoading(true);
    try {
      await newsService.updateUserRole(uid, targetRole);
      await newsService.logActivity(user!.uid, user!.email!, `Updated User Privilege for ${targetEmail} to [${targetRole}]`);
      setCrudSuccess('User privilege matrix restructured.');
      loadDashboardData();
    } catch (err: any) {
      setCrudError(err.message || 'Failed modifying role.');
    } finally {
      setActionLoading(false);
    }
  };

  // Quick tag toggling in article form
  const handleTagToggle = (tagSlug: string) => {
    if (selectedTags.includes(tagSlug)) {
      setSelectedTags(selectedTags.filter(t => t !== tagSlug));
    } else {
      setSelectedTags([...selectedTags, tagSlug]);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-bold text-slate-400 uppercase tracking-widest">Validating security clearance...</p>
      </div>
    );
  }

  // --- 1. LOGIN SCREEN ---
  if (!user || !userProfile) {
    return (
      <div className="min-h-[85vh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-violet-500/20">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Secure News Terminal
            </h2>
            <p className="text-xs font-black uppercase tracking-widest text-violet-500">
              {isRegistering ? 'Provision credentials' : 'Clearance Required'}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isRegistering && (
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400">Reporter Name</label>
                <input
                  type="text"
                  placeholder="Elena Rostova"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
                  required
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-wider text-slate-400">Email Address</label>
              <input
                type="email"
                placeholder="reporter@bossnews.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-wider text-slate-400">Encryption Key (Password)</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
                required
              />
            </div>

            {authError && (
              <div className="space-y-2">
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
                {authError.includes('already registered') && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(false);
                      setAuthError('');
                    }}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                  >
                    Switch to Sign In
                  </button>
                )}
              </div>
            )}

            {authSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold rounded-lg">
                {authSuccessMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-violet-500/20 active:scale-95"
            >
              {isRegistering ? 'Register Terminal Profile' : 'Clear Terminal Clearance'}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white hover:underline font-semibold"
            >
              {isRegistering ? 'Back to Secured Login' : 'First-time user? Register terminal profile'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. MAIN ADMIN DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 flex flex-col md:flex-row">
      
      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-6 space-y-8 flex-shrink-0">
        <div className="space-y-1">
          <p className="text-[10px] text-violet-600 dark:text-violet-400 font-black uppercase tracking-widest">
            Sovereign Control
          </p>
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
            Admin node
          </h2>
          <div className="flex items-center gap-2 pt-2 bg-slate-100/50 dark:bg-slate-950/50 p-2.5 rounded-2xl border border-slate-200/40 dark:border-slate-800/40">
            <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-black">
              {userProfile.displayName?.slice(0,2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-extrabold truncate text-slate-900 dark:text-white">{userProfile.displayName}</p>
              <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">{userProfile.role}</p>
            </div>
          </div>
        </div>

        <nav className="space-y-1.5">
          <button
            onClick={() => { setActiveTab('overview'); setIsEditingArticle(false); }}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'overview' && !isEditingArticle
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            Overview
          </button>

          <button
            onClick={() => { setActiveTab('articles'); }}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'articles' || isEditingArticle
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Articles CRUD
          </button>

          <button
            onClick={() => { setActiveTab('marketplace'); setIsEditingArticle(false); }}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'marketplace' && !isEditingArticle
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Marketplace Manager
          </button>

          <button
            onClick={() => { setActiveTab('categories'); setIsEditingArticle(false); }}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'categories' && !isEditingArticle
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            Categories & Tags
          </button>

          {userProfile.role === 'admin' && (
            <button
              onClick={() => { setActiveTab('roles'); setIsEditingArticle(false); }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'roles' && !isEditingArticle
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              User Roles
            </button>
          )}

          <button
            onClick={() => { setActiveTab('logs'); setIsEditingArticle(false); }}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'logs' && !isEditingArticle
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            Activity Logs
          </button>

          <button
            onClick={() => { setActiveTab('backup'); setIsEditingArticle(false); }}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'backup' && !isEditingArticle
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Cloud className="w-4 h-4" />
            Drive Exporter
          </button>
        </nav>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN DATA CONTENT WORKSPACE */}
      <main className="flex-1 p-6 md:p-12 overflow-x-hidden">

        {/* --- GLOBAL ALERTS BAR --- */}
        {crudSuccess && (
          <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold rounded-2xl flex items-center justify-between">
            <span className="flex items-center gap-2"><Check className="w-4 h-4" /> {crudSuccess}</span>
            <button onClick={() => setCrudSuccess('')}><X className="w-4 h-4" /></button>
          </div>
        )}
        {crudError && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-2xl flex items-center justify-between">
            <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {crudError}</span>
            <button onClick={() => setCrudError('')}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* --- A. OVERVIEW PANEL TAB --- */}
        {activeTab === 'overview' && !isEditingArticle && (
          <div className="space-y-10">
            <div>
              <p className="text-xs uppercase font-black text-slate-400 tracking-widest mb-1">Operational status</p>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase">Dashboard overview</h1>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-2">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total Articles</p>
                <p className="text-4xl font-black">{articles.length}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Cloud system nodes</p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-2">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Published</p>
                <p className="text-4xl font-black text-violet-600 dark:text-violet-400">
                  {articles.filter(a => a.status === 'published').length}
                </p>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Active in feed</p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-2">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Drafts / Queue</p>
                <p className="text-4xl font-black text-amber-500">
                  {articles.filter(a => a.status === 'draft' || a.status === 'scheduled').length}
                </p>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Pending clearance</p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-2">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total Views</p>
                <p className="text-4xl font-black text-emerald-500">
                  {articles.reduce((acc, current) => acc + (current.views || 0), 0).toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Audience engagement</p>
              </div>
            </div>

            {/* Quick Actions & Recent articles */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-black uppercase tracking-widest">Recent Dispatch Drafts & Logs</h3>
                  <button onClick={() => setActiveTab('articles')} className="text-xs font-black text-violet-500 uppercase tracking-wider hover:underline">Manage</button>
                </div>

                <div className="space-y-4">
                  {articles.slice(0, 5).map(art => (
                    <div key={art.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl text-xs border border-slate-100 dark:border-slate-800/50">
                      <div>
                        <p className="font-extrabold truncate max-w-[250px] md:max-w-md text-slate-900 dark:text-white">{art.title}</p>
                        <p className="text-[10px] text-slate-400">By {art.author} • {art.region}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        art.status === 'published' ? 'bg-violet-100 text-violet-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {art.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar stats */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-3">Operational Meta</h3>
                <div className="space-y-3.5 text-xs font-semibold">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Firebase Region</span>
                    <span>us-central</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Firestore ID</span>
                    <span className="truncate max-w-[150px]">{db.app.options.projectId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Registries</span>
                    <span>{categories.length} Cats / {tags.length} Tags</span>
                  </div>
                  <button 
                    onClick={() => setActiveTab('articles')}
                    className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Publish New Dispatch
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* --- B. ARTICLES CRUD & EDITOR TAB --- */}
        {activeTab === 'articles' && !isEditingArticle && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase font-black text-slate-400 tracking-widest mb-1">Operational nodes</p>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase">Articles Management</h1>
              </div>
              <button
                onClick={() => setIsEditingArticle(true)}
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-violet-500/20 active:scale-95 transition-all flex items-center gap-1.5 self-start sm:self-center"
              >
                <Plus className="w-4 h-4" /> Create Dispatch
              </button>
            </div>

            {/* List of existing articles */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs md:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="p-4 md:p-6">Dispatch Title</th>
                      <th className="p-4 md:p-6">Author</th>
                      <th className="p-4 md:p-6">Region</th>
                      <th className="p-4 md:p-6">Category</th>
                      <th className="p-4 md:p-6">Views</th>
                      <th className="p-4 md:p-6">Status</th>
                      <th className="p-4 md:p-6 text-right">Actions Matrix</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {articles.map((art) => (
                      <tr key={art.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 font-medium">
                        <td className="p-4 md:p-6 max-w-xs md:max-w-md">
                          <p className="font-extrabold truncate text-slate-950 dark:text-white leading-snug">{art.title}</p>
                          <p className="text-[10px] text-slate-400">Slug: {art.slug}</p>
                        </td>
                        <td className="p-4 md:p-6 text-xs text-slate-500 dark:text-slate-400 font-bold">{art.author}</td>
                        <td className="p-4 md:p-6 text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wide">{art.region}</td>
                        <td className="p-4 md:p-6 text-xs">
                          <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 font-bold rounded text-slate-600 dark:text-slate-300">
                            {categories.find(c => c.slug === art.category)?.name || art.category}
                          </span>
                        </td>
                        <td className="p-4 md:p-6 font-bold">{art.views?.toLocaleString() || 0}</td>
                        <td className="p-4 md:p-6 text-xs">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            art.status === 'published' ? 'bg-violet-100 text-violet-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {art.status}
                          </span>
                        </td>
                        <td className="p-4 md:p-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditArticleClick(art)}
                              className="p-1.5 text-slate-400 hover:text-violet-500 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-950/40"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteArticle(art.id, art.title)}
                              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
                              title="Purge"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- B2. RICH ARTICLE CREATION & DRAFT EDITOR SCREEN --- */}
        {isEditingArticle && (
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <p className="text-xs uppercase font-black text-slate-400 tracking-widest mb-1">Editor Suite</p>
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  {articleFormId ? 'Modify Intelligence Dispatch' : 'Draft Sovereign Dispatch'}
                </h2>
              </div>
              <button onClick={resetArticleForm} className="text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 text-xs font-black uppercase tracking-widest">
                <X className="w-4.5 h-4.5" /> Cancel
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="space-y-8">
              {/* Form card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Inputs Left (Title, subtitle, slugs, tags, category) */}
                <div className="md:col-span-2 space-y-6">
                  
                  {/* Title */}
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Headline Title</label>
                    <input
                      type="text"
                      placeholder="The Dawn of Autonomous Conglomerates..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-950 dark:text-white"
                      required
                    />
                  </div>

                  {/* Subtitle */}
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Dek / Subtitle</label>
                    <textarea
                      placeholder="From algorithmic boards to fully automated workforces..."
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                      rows={2}
                    />
                  </div>

                  {/* Slug */}
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">URL Slug</label>
                    <input
                      type="text"
                      placeholder="dawn-autonomous-conglomerates-ai-ceos"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono"
                      required
                    />
                  </div>

                  {/* Content (Rich Text Markdown Editor with dual screen preview) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400">Article Content (Markdown Approved)</label>
                      <span className="text-[10px] text-violet-500 uppercase font-black">Dual-scroll render ready</span>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      <textarea
                        placeholder="Use standard Markdown like ## headers, > quotes, or lists..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500 h-[350px]"
                        required
                      />
                      {/* Real-time Preview Area */}
                      <div className="hidden xl:block p-4 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-2xl overflow-y-auto h-[350px] article-rich-text text-sm">
                        <p className="text-[10px] uppercase font-black text-violet-500 mb-2 border-b border-violet-500/20 pb-1">Real-time Layout Render</p>
                        {content ? (
                          content.split('\n').map((line, idx) => {
                            const trimmed = line.trim();
                            if (trimmed.startsWith('## ')) return <h2 key={idx}>{trimmed.slice(3)}</h2>;
                            if (trimmed.startsWith('### ')) return <h3 key={idx}>{trimmed.slice(4)}</h3>;
                            if (trimmed.startsWith('> ')) return <blockquote key={idx}>{trimmed.slice(2)}</blockquote>;
                            if (trimmed === '---') return <hr key={idx} />;
                            return <p key={idx}>{trimmed}</p>;
                          })
                        ) : (
                          <p className="text-slate-400 italic">Preview will stream here as you compose your journalism...</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SEO Meta Headers */}
                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-6 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-violet-500">Search Engine Optimization (SEO) Fields</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400">SEO Title</label>
                        <input
                          type="text"
                          placeholder="Meta Title"
                          value={metaTitle}
                          onChange={(e) => setMetaTitle(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400">SEO Description</label>
                        <input
                          type="text"
                          placeholder="Meta Description"
                          value={metaDescription}
                          onChange={(e) => setMetaDescription(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Sidebar Inputs Right (Author, Category, Tags selection, Statuses, Images, Media) */}
                <div className="space-y-6">
                  
                  {/* Status selection */}
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400">Dissemination Status</label>
                      <select
                        value={status}
                        onChange={(e: any) => setStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                      >
                        <option value="draft">Draft mode (internal Only)</option>
                        <option value="published">Published (live worldwide)</option>
                        <option value="scheduled">Scheduled release</option>
                      </select>
                    </div>

                    {status === 'scheduled' && (
                      <div className="space-y-1">
                        <label className="text-xs font-black uppercase tracking-widest text-amber-500">Scheduled Time (UTC)</label>
                        <input
                          type="datetime-local"
                          value={scheduledAt}
                          onChange={(e) => setScheduledAt(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-amber-500/30 rounded-xl text-xs"
                          required
                        />
                      </div>
                    )}

                    <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                      <label className="flex items-center gap-2 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={featured}
                          onChange={(e) => setFeatured(e.target.checked)}
                          className="rounded text-violet-600 focus:ring-violet-500 w-4 h-4"
                        />
                        Featured Story (Homepage Slider)
                      </label>

                      <label className="flex items-center gap-2 font-bold cursor-pointer text-red-500">
                        <input
                          type="checkbox"
                          checked={breaking}
                          onChange={(e) => setBreaking(e.target.checked)}
                          className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                        />
                        Breaking Alert (Homepage Marquee)
                      </label>
                    </div>
                  </div>

                  {/* Author / Territory */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400">Dispatch Author</label>
                      <input
                        type="text"
                        placeholder="Elena Rostova"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400">Region</label>
                        <select
                          value={region}
                          onChange={(e) => setRegion(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                        >
                          <option value="World">World</option>
                          <option value="North America">North America</option>
                          <option value="Europe">Europe</option>
                          <option value="Asia">Asia</option>
                          <option value="Middle East">Middle East</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400">Country Code</label>
                        <input
                          type="text"
                          placeholder="US, CH, Global"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Category select */}
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Dispatch Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.slug}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Media uploads manager */}
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Media Upload Manager</p>
                    
                    <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                      <button 
                        type="button"
                        onClick={() => setUploadType('image')}
                        className={`px-3 py-1 text-xs font-extrabold uppercase rounded-lg ${uploadType === 'image' ? 'bg-violet-600 text-white' : 'text-slate-400'}`}
                      >
                        Image File
                      </button>
                      <button 
                        type="button"
                        onClick={() => setUploadType('video')}
                        className={`px-3 py-1 text-xs font-extrabold uppercase rounded-lg ${uploadType === 'video' ? 'bg-violet-600 text-white' : 'text-slate-400'}`}
                      >
                        Video Reference
                      </button>
                    </div>

                    <div className="flex flex-col gap-2 items-center justify-center border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-900 relative">
                      <Upload className="w-6 h-6 text-slate-400 animate-pulse" />
                      <p className="text-[10px] font-bold text-slate-400 text-center">Drag / Select Local File</p>
                      <input 
                        type="file" 
                        accept={uploadType === 'image' ? 'image/*' : 'video/*'}
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        disabled={uploadProgress}
                      />
                      {uploadProgress && <span className="text-[9px] text-violet-500 font-black uppercase">Encoding pipeline active...</span>}
                    </div>

                    {/* Manual Url */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Or provide direct URL override</label>
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/..."
                        value={uploadType === 'image' ? imageUrl : videoUrl}
                        onChange={(e) => {
                          if (uploadType === 'image') setImageUrl(e.target.value);
                          else setVideoUrl(e.target.value);
                        }}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                      />
                    </div>

                    {/* Small image preview */}
                    {imageUrl && uploadType === 'image' && (
                      <div className="h-20 w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 relative bg-slate-950">
                        <img src={imageUrl} alt="preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button type="button" onClick={() => setImageUrl('')} className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full"><X className="w-3 h-3" /></button>
                      </div>
                    )}
                  </div>

                  {/* Tags Selection checks */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Attached Tag Matrix</label>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map(tg => {
                        const active = selectedTags.includes(tg.slug);
                        return (
                          <button
                            key={tg.id}
                            type="button"
                            onClick={() => handleTagToggle(tg.slug)}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${
                              active 
                                ? 'bg-violet-600 text-white' 
                                : 'bg-slate-100 dark:bg-slate-950 text-slate-500 border border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            #{tg.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </div>

              {/* Action buttons */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-violet-500/20 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" /> 
                  {actionLoading ? 'Executing pipeline...' : (articleFormId ? 'Update Intelligence' : 'Publish Intelligence')}
                </button>
                <button
                  type="button"
                  onClick={resetArticleForm}
                  className="px-6 py-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- C. CATEGORIES & TAGS MANAGEMENT TAB --- */}
        {activeTab === 'categories' && !isEditingArticle && (
          <div className="space-y-12">
            <div>
              <p className="text-xs uppercase font-black text-slate-400 tracking-widest mb-1">Taxonomy nodes</p>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase">Categories & Tags</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              
              {/* Categories segment */}
              <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-violet-500" />
                  Category Registries (Only Admins)
                </h3>

                {/* Create Category form */}
                {userProfile.role === 'admin' ? (
                  <form onSubmit={handleCreateCategory} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Name</label>
                        <input
                          type="text"
                          placeholder="Macro Economics"
                          value={newCatName}
                          onChange={(e) => {
                            setNewCatName(e.target.value);
                            setNewCatSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                          }}
                          className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Slug</label>
                        <input
                          type="text"
                          placeholder="macro-economics"
                          value={newCatSlug}
                          onChange={(e) => setNewCatSlug(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                          required
                        />
                      </div>
                    </div>
                    <button type="submit" disabled={actionLoading} className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all">
                      {actionLoading ? 'Saving...' : 'Register Category Node'}
                    </button>
                  </form>
                ) : (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs rounded-2xl font-bold">
                    Clearance editor role can only view categories. Role administration restricted.
                  </div>
                )}

                {/* Categories List */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
                  {categories.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold">
                      <div>
                        <p className="text-slate-900 dark:text-white text-sm font-extrabold">{c.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Slug: {c.slug}</p>
                      </div>
                      {userProfile.role === 'admin' && (
                        <button 
                          onClick={async () => {
                            if (window.confirm(`Delete category "${c.name}"?`)) {
                              await newsService.deleteCategory(c.id);
                              await newsService.logActivity(user!.uid, user!.email!, `Deleted Category: "${c.name}"`);
                              loadDashboardData();
                            }
                          }}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 rounded-lg"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

              </div>

              {/* Tags segment */}
              <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
                  <Tags className="w-5 h-5 text-violet-500" />
                  Tag Registries
                </h3>

                {/* Create Tag form */}
                <form onSubmit={handleCreateTag} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Name</label>
                      <input
                        type="text"
                        placeholder="Longevity"
                        value={newTagName}
                        onChange={(e) => {
                          setNewTagName(e.target.value);
                          setNewTagSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                        }}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Slug</label>
                      <input
                        type="text"
                        placeholder="longevity"
                        value={newTagSlug}
                        onChange={(e) => setNewTagSlug(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={actionLoading} className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all">
                    {actionLoading ? 'Saving...' : 'Register Tag Node'}
                  </button>
                </form>

                {/* Tags list */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                  <div className="flex flex-wrap gap-2">
                    {tags.map(t => (
                      <span key={t.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300">
                        #{t.name}
                        <button 
                          onClick={async () => {
                            if (window.confirm(`Purge tag "${t.name}"?`)) {
                              await newsService.deleteTag(t.id);
                              await newsService.logActivity(user!.uid, user!.email!, `Deleted Tag: "${t.name}"`);
                              loadDashboardData();
                            }
                          }}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* --- D. USER ROLES CLEARANCE TAB (ONLY ADMINS) --- */}
        {activeTab === 'roles' && userProfile.role === 'admin' && !isEditingArticle && (
          <div className="space-y-8">
            <div>
              <p className="text-xs uppercase font-black text-slate-400 tracking-widest mb-1">Clearance privilege matrix</p>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase">User Role Clearance</h1>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="p-4 md:p-6">User profile</th>
                    <th className="p-4 md:p-6">Registry email</th>
                    <th className="p-4 md:p-6">Clearance role</th>
                    <th className="p-4 md:p-6 text-right">Assign privilege matrix</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {usersList.map((usr) => (
                    <tr key={usr.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 font-medium">
                      <td className="p-4 md:p-6 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold">
                          {usr.displayName?.slice(0,2).toUpperCase()}
                        </div>
                        <span className="font-extrabold text-slate-950 dark:text-white">{usr.displayName}</span>
                      </td>
                      <td className="p-4 md:p-6 text-xs text-slate-500 font-bold">{usr.email}</td>
                      <td className="p-4 md:p-6 text-xs">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          usr.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {usr.role}
                        </span>
                      </td>
                      <td className="p-4 md:p-6 text-right">
                        {usr.uid !== user.uid ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleRoleUpdate(usr.uid, 'admin', usr.email)}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[9px] font-black uppercase tracking-widest rounded-md"
                            >
                              Make Admin
                            </button>
                            <button
                              onClick={() => handleRoleUpdate(usr.uid, 'editor', usr.email)}
                              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[9px] font-black uppercase tracking-widest rounded-md"
                            >
                              Make Editor
                            </button>
                            <button
                              onClick={() => handleRoleUpdate(usr.uid, 'viewer', usr.email)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-md"
                            >
                              Make Viewer
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Self-clearing node (Active lock)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- E. ACTIVITY LOGS AUDIT TRAIL TAB --- */}
        {activeTab === 'logs' && !isEditingArticle && (
          <div className="space-y-8">
            <div>
              <p className="text-xs uppercase font-black text-slate-400 tracking-widest mb-1">Clearance audit logs</p>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase">Operational Logs</h1>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="space-y-3.5">
                {logs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No operational telemetry logged yet.</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="flex items-start md:items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40 rounded-2xl text-xs">
                      <div className="flex items-start md:items-center gap-3">
                        <Activity className="w-4 h-4 text-violet-500 mt-0.5 md:mt-0 flex-shrink-0" />
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white leading-tight">
                            {log.action}
                          </p>
                          <p className="text-[9px] text-slate-400 uppercase tracking-wider">
                            By: {log.userEmail}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-extrabold flex-shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- F. GOOGLE DRIVE BACKUP & EXPORT TAB --- */}
        {activeTab === 'backup' && !isEditingArticle && (
          <div className="space-y-8">
            <div>
              <p className="text-xs uppercase font-black text-slate-400 tracking-widest mb-1">Cloud synchronization node</p>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase">Google Drive Backup</h1>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl max-w-2xl space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div className="p-3 bg-violet-500/10 text-violet-500 rounded-2xl">
                  <Cloud className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white">Workspace Exporter</h3>
                  <p className="text-xs text-slate-400">Archive and export the entire codebase of Geneva News to your personal Google Drive.</p>
                </div>
              </div>

              <div className="space-y-4 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                <p>
                  This utility performs a secure, live-compilation of the workspace files (excluding <code className="bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded text-violet-500 font-mono text-[11px]">node_modules</code> and build artifacts) and uploads the archive directly into your secure Google Drive space.
                </p>
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2">
                  <p className="text-[10px] text-violet-500 uppercase font-black tracking-widest">Permissions & Access</p>
                  <p className="text-[11px] leading-normal font-medium text-slate-400">
                    With your permission, this applet uses Google Drive APIs to create and save the ZIP archive. Your credentials are processed entirely in memory and are never saved or stored.
                  </p>
                </div>
              </div>

              {backupResult && (
                <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-500 text-xs font-black uppercase tracking-wider">
                    <Check className="w-4 h-4" />
                    <span>Backup Upload Completed Successfully!</span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium space-y-1">
                    <p><strong className="text-slate-700 dark:text-slate-300">File Name:</strong> {backupResult.fileName}</p>
                    <p><strong className="text-slate-700 dark:text-slate-300">Google Drive ID:</strong> {backupResult.fileId}</p>
                  </div>
                  <a
                    href={backupResult.link}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/10 active:scale-95 animate-pulse"
                  >
                    Open in Google Drive <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                {!googleDriveToken ? (
                  <button
                    onClick={handleExportToDrive}
                    disabled={backupLoading}
                    className="w-full sm:w-auto px-6 py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-violet-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {backupLoading ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" /> Compiling & Syncing...
                      </>
                    ) : (
                      <>
                        <HardDrive className="w-4 h-4" /> Connect Drive & Save Code
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleExportToDrive}
                    disabled={backupLoading}
                    className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {backupLoading ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" /> Uploading to Drive...
                      </>
                    ) : (
                      <>
                        <Cloud className="w-4 h-4" /> Push Code Backup Again
                      </>
                    )}
                  </button>
                )}

                {googleDriveToken && (
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-extrabold uppercase tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-full">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Drive Session Linked
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- G. MARKETPLACE MANAGER TAB --- */}
        {activeTab === 'marketplace' && (
          <div className="space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase font-black text-slate-400 tracking-widest mb-1">Corporate Commerce Terminal</p>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase">Marketplace Manager</h1>
              </div>
              {!isEditingProduct && (
                <button
                  onClick={() => {
                    resetProductForm();
                    setIsEditingProduct(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-violet-500/25 active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Add Asset / Item For Sale
                </button>
              )}
            </div>

            {isEditingProduct ? (
              /* CREATE OR EDIT PRODUCT FORM */
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5 mb-6">
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-violet-500" />
                    {productFormId ? 'Modify Product Listing' : 'List New Product Online For Sale'}
                  </h3>
                  <button
                    onClick={resetProductForm}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveProduct} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Title */}
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-400">Product Title / Item Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Encrypted Satellite Transceiver V3"
                        value={prodTitle}
                        onChange={(e) => setProdTitle(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
                        required
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-400">Category</label>
                      <select
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white font-semibold"
                      >
                        <option value="Electronics & Comm Tech">Electronics & Comm Tech</option>
                        <option value="Sovereign Intel & Reports">Sovereign Intel & Reports</option>
                        <option value="Luxury Goods & Services">Luxury Goods & Services</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Condition */}
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-400">Asset Condition</label>
                      <select
                        value={prodCondition}
                        onChange={(e) => setProdCondition(e.target.value as any)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white font-semibold"
                      >
                        <option value="new">Brand New</option>
                        <option value="used">Used / Operational</option>
                        <option value="refurbished">Refurbished</option>
                        <option value="not_applicable">Asset / Service / Other</option>
                      </select>
                    </div>

                    {/* Price */}
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-400">Price (Number)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={prodPrice}
                        onChange={(e) => setProdPrice(Number(e.target.value))}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
                        required
                        min="0"
                      />
                    </div>

                    {/* Currency */}
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-400">Currency</label>
                      <input
                        type="text"
                        placeholder="USD"
                        value={prodCurrency}
                        onChange={(e) => setProdCurrency(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
                        required
                      />
                    </div>

                    {/* Image URL */}
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-400">Image URL</label>
                      <input
                        type="text"
                        placeholder="e.g. https://images.unsplash.com/... or leave blank"
                        value={prodImageUrl}
                        onChange={(e) => setProdImageUrl(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-400">Product / Service Description</label>
                      <textarea
                        placeholder="Describe the asset, its key parameters, shipping/escrow options, or terms..."
                        value={prodDescription}
                        onChange={(e) => setProdDescription(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white leading-relaxed font-medium"
                        required
                      ></textarea>
                    </div>

                    {/* SELLER DETAILS */}
                    <div className="md:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-black uppercase tracking-widest text-violet-500 mb-4">Authorized Contact & Broker Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase tracking-wider text-slate-400">Seller Name</label>
                          <input
                            type="text"
                            value={prodSellerName}
                            onChange={(e) => setProdSellerName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase tracking-wider text-slate-400">Seller Email</label>
                          <input
                            type="email"
                            value={prodSellerEmail}
                            onChange={(e) => setProdSellerEmail(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase tracking-wider text-slate-400">Phone Number</label>
                          <input
                            type="text"
                            value={prodSellerPhone}
                            onChange={(e) => setProdSellerPhone(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase tracking-wider text-slate-400">WhatsApp Line</label>
                          <input
                            type="text"
                            value={prodSellerWhatsApp}
                            onChange={(e) => setProdSellerWhatsApp(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Listing Status */}
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-400">Listing Status</label>
                      <select
                        value={prodStatus}
                        onChange={(e) => setProdStatus(e.target.value as any)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white font-semibold"
                      >
                        <option value="available">Available For Sale</option>
                        <option value="sold">Sold / Completed</option>
                        <option value="archived">Archived / Hidden</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-violet-500/25 active:scale-95 disabled:opacity-50"
                    >
                      {actionLoading ? 'Saving...' : 'Dispatched Listing'}
                    </button>
                    <button
                      type="button"
                      onClick={resetProductForm}
                      className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* PRODUCTS DIRECTORY LIST */
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h3 className="font-extrabold text-base text-slate-950 dark:text-white uppercase tracking-wider">
                    Catalog Listings Directory ({productsList.length})
                  </h3>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800/80">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-extrabold uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                        <th className="px-6 py-4">Product / Item</th>
                        <th className="px-6 py-4">Price</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Seller</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                      {productsList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-slate-400 italic">
                            No products online for sale yet. Start by listing an asset.
                          </td>
                        </tr>
                      ) : (
                        productsList.map((prod) => (
                          <tr key={prod.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {prod.imageUrl ? (
                                  <img
                                    src={prod.imageUrl}
                                    alt={prod.title}
                                    referrerPolicy="no-referrer"
                                    className="w-10 h-10 object-cover rounded-lg border border-slate-100 dark:border-slate-800"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-950 flex items-center justify-center text-slate-400">
                                    <ShoppingBag className="w-4 h-4" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-extrabold text-slate-950 dark:text-white max-w-[200px] truncate">{prod.title}</p>
                                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">ID: {prod.id.substr(0,8)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-extrabold text-slate-900 dark:text-violet-400">
                              {prod.currency} {prod.price.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-bold">
                              {prod.category}
                            </td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                              {prod.sellerName}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                prod.status === 'available'
                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                  : prod.status === 'sold'
                                  ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                  : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                              }`}>
                                {prod.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEditProductClick(prod)}
                                  className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 transition-colors"
                                  title="Edit Listing"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(prod.id, prod.title)}
                                  className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/50 rounded-lg text-red-500 transition-colors"
                                  title="Purge Listing"
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

    </div>
  );
};

export default AdminDashboard;
