import { create } from 'zustand';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  publicKey: string | null;
  privateKey: CryptoKey | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setKeys: (publicKey: string | null, privateKey: CryptoKey | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  publicKey: null,
  privateKey: null,
  isLoading: true,
  error: null,
  setUser: (user) => set({ user }),
  setKeys: (publicKey, privateKey) => set({ publicKey, privateKey }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearAuth: () => set({ user: null, publicKey: null, privateKey: null, error: null }),
}));
