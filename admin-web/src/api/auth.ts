import { request } from './request';
import type { LoginResult } from '@/types/api';

export function loginAdmin(payload: { username: string; password: string }) {
  return request<LoginResult>({
    url: '/admin/auth/login',
    method: 'POST',
    data: payload,
  });
}
