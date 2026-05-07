import { create } from 'zustand';
import type { IUser } from '../types';

interface AuthState {
  user: IUser | null;
  isAuthenticated: boolean;
  login: (user: IUser) => void;
  logout: () => void;
}

const storedUser = localStorage.getItem('unidel-user');

export const useAuthStore = create<AuthState>((set) => ({
  user: storedUser ? JSON.parse(storedUser) : null,
  isAuthenticated: !!storedUser,
  login: (user) => {
    localStorage.setItem('unidel-user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('unidel-user');
    set({ user: null, isAuthenticated: false });
  },
}));