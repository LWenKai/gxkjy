import { defineStore } from 'pinia';
import type { ClientCompany, ClientUser } from '@/types/api';

const TOKEN_KEY = 'guxin_client_token';
const USER_KEY = 'guxin_client_user';
const COMPANY_KEY = 'guxin_client_company';

function readClientUser(): ClientUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ClientUser;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

function readClientCompany(): ClientCompany | null {
  const raw = localStorage.getItem(COMPANY_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ClientCompany;
  } catch {
    localStorage.removeItem(COMPANY_KEY);
    return null;
  }
}

export const useClientAuthStore = defineStore('client-auth', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || '',
    user: readClientUser(),
    company: readClientCompany(),
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.token),
    displayName: (state) =>
      state.user?.real_name || state.user?.username || '客户',
    modules: (state): string[] => {
      const company = state.company as (typeof state.company & {
        modules?: unknown;
        client_modules?: unknown;
      }) | null;
      if (Array.isArray(company?.modules)) {
        return company.modules as string[];
      }
      if (typeof company?.client_modules === 'string' && company.client_modules.trim()) {
        return company.client_modules.split(',').map((m) => m.trim()).filter(Boolean);
      }
      return [];
    },
    hasModule: (state) => (key: string) =>
      (state.company?.modules || []).includes(key as never),
  },
  actions: {
    setSession(token: string, user: ClientUser, company: ClientCompany) {
      this.token = token;
      this.user = user;
      this.company = company;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(COMPANY_KEY, JSON.stringify(company));
    },
    clearSession() {
      this.token = '';
      this.user = null;
      this.company = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(COMPANY_KEY);
    },
  },
});

export function getStoredClientToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function clearStoredClientSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(COMPANY_KEY);
}
