import { create } from 'zustand';
import { Org } from '@/types';

interface AuthState {
  org: Org | null;
  isLoading: boolean;
  setOrg: (org: Org | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  org: null,
  isLoading: true,
  setOrg: (org) => set({ org, isLoading: false }),
  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    }
    set({ org: null, isLoading: false });
  },
}));
