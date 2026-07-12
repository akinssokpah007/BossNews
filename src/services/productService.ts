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
  setDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';

// --- ROBUST FALLBACK SEED PRODUCTS ---

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    title: 'Nautilus Sovereign Satellite Terminal (Quantum-Encrypted)',
    description: 'High-speed, dual-channel satellite transceiver engineered for high-net-worth individuals and corporate crisis operations. Provides uninterrupted military-grade data routing under any global scenario.',
    price: 12500,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop',
    category: 'Electronics & Comm Tech',
    condition: 'new',
    sellerName: 'BOSS.NEWS Premium Intelligence',
    sellerPhone: '+231889792996',
    sellerWhatsApp: '+231889792996',
    sellerEmail: 'aki.sokpah.link@gmail.com',
    status: 'available',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  },
  {
    id: 'prod-2',
    title: 'Global Macroeconomic Security Dossier (2026-2027)',
    description: 'Bespoke corporate research detailing emerging regulatory barriers, supply-chain re-routings, and sovereign wealth investment shifts. Essential reading for venture builders and investment offices.',
    price: 4900,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=600&auto=format&fit=crop',
    category: 'Sovereign Intel & Reports',
    condition: 'not_applicable',
    sellerName: 'Akin S. Sokpah Associates',
    sellerPhone: '+231889792996',
    sellerWhatsApp: '+231889792996',
    sellerEmail: 'aki.sokpah.link@gmail.com',
    status: 'available',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
  },
  {
    id: 'prod-3',
    title: 'Biometric Cryptographic Hardware Enclave Drive (2TB)',
    description: 'Aerospace-grade titanium-housed solid-state drive featuring zero-knowledge hardware encryption keys, thermal destruction circuits, and direct biometric authentication.',
    price: 950,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=600&auto=format&fit=crop',
    category: 'Electronics & Comm Tech',
    condition: 'new',
    sellerName: 'BOSS.NEWS Global Media Inc.',
    sellerPhone: '+231889792996',
    sellerWhatsApp: '+231889792996',
    sellerEmail: 'aki.sokpah.link@gmail.com',
    status: 'available',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString()
  }
];

// --- LOCAL STORAGE HELPERS ---

function getLocalProducts(): Product[] {
  try {
    const data = localStorage.getItem('boss_news_products');
    if (!data) {
      localStorage.setItem('boss_news_products', JSON.stringify(DEFAULT_PRODUCTS));
      return DEFAULT_PRODUCTS;
    }
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_PRODUCTS;
  }
}

function saveLocalProducts(products: Product[]) {
  try {
    localStorage.setItem('boss_news_products', JSON.stringify(products));
  } catch (e) {
    console.error("Local storage products save failed", e);
  }
}

// --- PRODUCT SERVICE ---

export const productService = {
  async getProducts(): Promise<Product[]> {
    const localProds = getLocalProducts();
    try {
      const colRef = collection(db, 'products');
      const snapPromise = getDocs(colRef);
      const timeoutPromise = new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1500));
      
      const snap = await Promise.race([snapPromise, timeoutPromise]);
      if (snap) {
        const dbProds = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        
        // Merge cloud products with local ones, maintaining newest items
        const dbIdSet = new Set(dbProds.map(p => p.id));
        const localOnly = localProds.filter(p => !dbIdSet.has(p.id) && !p.id.startsWith('prod-local-'));
        const localNew = localProds.filter(p => p.id.startsWith('prod-local-'));
        
        const merged = [...dbProds, ...localOnly, ...localNew];
        saveLocalProducts(merged);
        return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    } catch (error) {
      console.warn("Firestore products fetch timed out or offline. Falling back to local cache.", error);
    }
    return localProds.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createProduct(prod: Omit<Product, 'id'>): Promise<string> {
    const id = 'prod-local-' + Math.random().toString(36).substr(2, 9);
    const newProd: Product = { id, ...prod };
    
    // Save to local cache immediately
    const local = getLocalProducts();
    local.unshift(newProd);
    saveLocalProducts(local);

    try {
      const colRef = collection(db, 'products');
      const cleaned = Object.fromEntries(
        Object.entries(prod).filter(([_, v]) => v !== undefined)
      );
      
      const writePromise = addDoc(colRef, cleaned).then(docRef => {
        // Swap local temporary ID with real Firestore ID
        const updatedLocal = getLocalProducts();
        const index = updatedLocal.findIndex(p => p.id === id);
        if (index !== -1) {
          updatedLocal[index].id = docRef.id;
          saveLocalProducts(updatedLocal);
        }
        return docRef.id;
      });

      const timeoutPromise = new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 1800)
      );

      return await Promise.race([writePromise, timeoutPromise]);
    } catch (error) {
      console.warn("Could not sync product creation to Cloud Firestore. Saved locally.", error);
      return id;
    }
  },

  async updateProduct(id: string, prod: Partial<Product>): Promise<void> {
    const local = getLocalProducts();
    const index = local.findIndex(p => p.id === id);
    if (index !== -1) {
      local[index] = { ...local[index], ...prod };
      saveLocalProducts(local);
    }

    try {
      const docRef = doc(db, 'products', id);
      const cleaned = Object.fromEntries(
        Object.entries(prod).filter(([_, v]) => v !== undefined)
      );
      
      const writePromise = updateDoc(docRef, cleaned);
      const timeoutPromise = new Promise<void>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 1800)
      );

      await Promise.race([writePromise, timeoutPromise]);
    } catch (error) {
      console.warn("Could not sync product update to Cloud Firestore. Saved locally.", error);
    }
  },

  async deleteProduct(id: string): Promise<void> {
    const local = getLocalProducts();
    const filtered = local.filter(p => p.id !== id);
    saveLocalProducts(filtered);

    try {
      const docRef = doc(db, 'products', id);
      const writePromise = deleteDoc(docRef);
      const timeoutPromise = new Promise<void>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 1800)
      );

      await Promise.race([writePromise, timeoutPromise]);
    } catch (error) {
      console.warn("Could not sync product deletion to Cloud Firestore. Deleted locally.", error);
    }
  }
};
