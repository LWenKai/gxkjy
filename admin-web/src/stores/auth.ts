import { defineStore } from 'pinia';
import type { AdminUser } from '@/types/api';

const TOKEN_KEY = 'guxin_admin_token';
const ADMIN_USER_KEY = 'guxin_admin_user';

function readAdminUser(): AdminUser | null {
  const raw = localStorage.getItem(ADMIN_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    localStorage.removeItem(ADMIN_USER_KEY);
    return null;
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || '',
    adminUser: readAdminUser(),
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.token),
    displayName: (state) =>
      state.adminUser?.real_name || state.adminUser?.username || '管理员',
  },
  actions: {
    setSession(token: string, adminUser: AdminUser) {
      this.token = token;
      this.adminUser = adminUser;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(adminUser));
    },
    clearSession() {
      this.token = '';
      this.adminUser = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ADMIN_USER_KEY);
    },
  },
});

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function clearStoredSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
}
