import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';

export type UserRole = 'user' | 'technician';

export interface AuthUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  city?: string;
  specialty?: string;
  age?: number | null;
  address?: string;
  yearsExperience?: number;
  bio?: string;
  rating?: number;
  totalReviews?: number;
  avatar?: string;
  photoURL?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  currentUser: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

interface FirestoreUserData {
  name?: string;
  email?: string;
  role?: UserRole;
  phone?: string;
  city?: string;
  specialty?: string;
  age?: number | null;
  address?: string;
  yearsExperience?: number;
  bio?: string;
  rating?: number;
  totalReviews?: number;
  avatar?: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  currentUser: null,
  loading: true,
  isAuthenticated: false,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      try {
        if (!firebaseUser) {
          setUser(null);
          return;
        }

        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data() as FirestoreUserData;

          const mergedUser: AuthUser = {
            uid: firebaseUser.uid,
            name:
              data.name ||
              firebaseUser.displayName ||
              firebaseUser.email?.split('@')[0] ||
              'User',
            email: data.email || firebaseUser.email || '',
            role: data.role || 'user',
            phone: data.phone || '',
            city: data.city || '',
            specialty: data.specialty || '',
            age: data.age ?? null,
            address: data.address || '',
            yearsExperience: data.yearsExperience ?? 0,
            bio: data.bio || '',
            rating: data.rating ?? 0,
            totalReviews: data.totalReviews ?? 0,
            avatar: data.avatar || '',
            photoURL: firebaseUser.photoURL || data.avatar || '',
          };

          setUser(mergedUser);
        } else {
          const fallbackUser: AuthUser = {
            uid: firebaseUser.uid,
            name:
              firebaseUser.displayName ||
              firebaseUser.email?.split('@')[0] ||
              'User',
            email: firebaseUser.email || '',
            role: 'user',
            phone: '',
            city: '',
            specialty: '',
            age: null,
            address: '',
            yearsExperience: 0,
            bio: '',
            rating: 0,
            totalReviews: 0,
            avatar: '',
            photoURL: firebaseUser.photoURL || '',
          };

          console.warn(
            'User exists in Firebase Auth but no Firestore profile document was found.'
          );

          setUser(fallbackUser);
        }
      } catch (error) {
        console.error('AuthContext error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentUser: user,
        loading,
        isAuthenticated: !!user,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}