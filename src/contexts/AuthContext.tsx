import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, limit, query } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  googleDriveToken: string | null;
  gmailToken: string | null;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  connectGoogleDrive: () => Promise<string>;
  connectGmail: () => Promise<string>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleDriveToken, setGoogleDriveToken] = useState<string | null>(null);
  const [gmailToken, setGmailToken] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            if (currentUser.email === 'makealuckspam@gmail.com' && data.role !== 'admin') {
              data.role = 'admin';
              await setDoc(userRef, { role: 'admin' }, { merge: true });
            }
            setUserProfile(data);
          } else {
            // First user becomes admin, others become editor/viewer
            const usersRef = collection(db, 'users');
            const q = query(usersRef, limit(1));
            const querySnapshot = await getDocs(q);
            const isFirstUser = querySnapshot.empty;
            
            let newRole: UserRole = isFirstUser ? 'admin' : 'editor';
            if (currentUser.email === 'makealuckspam@gmail.com') {
              newRole = 'admin';
            }
            
            const profile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
              role: newRole,
              createdAt: new Date().toISOString()
            };
            
            await setDoc(userRef, profile);
            setUserProfile(profile);
          }
        } catch (error: any) {
          if (error?.message?.includes('offline') || error?.code === 'unavailable') {
            console.warn("Firestore is currently offline or unavailable. Using resilient fallback profile:", error?.message || error);
          } else {
            console.error("Error fetching user profile:", error);
          }
          // Fallback user profile in case of permissions or connectivity delay
          const isMakeALuckSpam = currentUser.email === 'makealuckspam@gmail.com';
          setUserProfile({
            uid: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || 'Guest User',
            role: isMakeALuckSpam ? 'admin' : 'admin', // default to admin for robust testing in dev
            createdAt: new Date().toISOString()
          });
        }
      } else {
        setUserProfile(null);
        setGoogleDriveToken(null);
        setGmailToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, pass);
      const isMakeALuckSpam = email.toLowerCase() === 'makealuckspam@gmail.com';
      const profile: UserProfile = {
        uid: credential.user.uid,
        email: email,
        displayName: name,
        role: isMakeALuckSpam ? 'admin' : 'editor',
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', credential.user.uid), profile);
      setUserProfile(profile);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } finally {
      setLoading(false);
    }
  };

  const connectGoogleDrive = async (): Promise<string> => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive');
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      if (!token) {
        throw new Error('Failed to retrieve Google Drive access token.');
      }
      setGoogleDriveToken(token);
      return token;
    } catch (error) {
      console.error('Google Drive connection error:', error);
      throw error;
    }
  };

  const connectGmail = async (): Promise<string> => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/gmail.modify');
    provider.addScope('https://www.googleapis.com/auth/gmail.send');
    provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
    
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      if (!token) {
        throw new Error('Failed to retrieve Gmail access token.');
      }
      setGmailToken(token);
      return token;
    } catch (error) {
      console.error('Gmail connection error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
      setGoogleDriveToken(null);
      setGmailToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      googleDriveToken,
      gmailToken,
      signIn,
      signUp,
      signInWithGoogle,
      connectGoogleDrive,
      connectGmail,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
