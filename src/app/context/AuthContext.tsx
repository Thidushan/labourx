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
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();

          setUser({
            uid: firebaseUser.uid,
            name: data.name || '',
            email: data.email || firebaseUser.email || '',
            role: data.role as UserRole,
            phone: data.phone || '',
            city: data.city || '',
            specialty: data.specialty || '',
            age: data.age ?? null,
            address: data.address || '',
            yearsExperience: data.yearsExperience ?? 0,
            bio: data.bio || '',
            rating: data.rating ?? 0,
            totalReviews: data.totalReviews ?? 0,
          });
        } else {
          setUser(null);
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
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
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