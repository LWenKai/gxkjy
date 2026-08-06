import axios, { type AxiosRequestConfig } from 'axios';
import { ElMessage } from 'element-plus';
import { clearStoredSession, getStoredToken } from '@/stores/auth';
import { clearStoredClientSession, getStoredClientToken } from '@/stores/clientAuth';
import type { ApiResponse } from '@/types/api';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
const appBasePath = import.meta.env.BASE_URL || '/';

interface ExtendedRequestConfig extends AxiosRequestConfig {
  clientAuth?: boolean;
  skipAuth?: boolean;
  silent?: boolean;
}

function normalizeParams(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.filter((item) => item !== '' && item !== null && item !== undefined);
  }
  const result: Record<string, unknown> = {};
  Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
    if (item === '' || item === null || item === undefined) return;
    result[key] = item;
  });
  return result;
}

function toAppPath(path: string) {
  const base = appBasePath.endsWith('/') ? appBasePath.slice(0, -1) : appBasePath;
  return `${base}${path}`;
}

const service = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
});

service.interceptors.request.use((config) => {
  const cfg = config as ExtendedRequestConfig;
  config.params = normalizeParams(config.params) as AxiosRequestConfig['params'];
  if (cfg.skipAuth === false) {
    return config;
  }
  const token = cfg.clientAuth ? getStoredClientToken() : getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

service.interceptors.response.use(
  (response) => {
    const payload = response.data as ApiResponse<unknown>;
    if (payload && payload.success === false) {
      ElMessage.error(payload.message || '\u8bf7\u6c42\u5931\u8d25');
      return Promise.reject(payload);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || '\u8bf7\u6c42\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5';

    ElMessage.error(message);

    if (status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/client')) {
        clearStoredClientSession();
        if (!currentPath.startsWith('/client/login')) {
          window.location.href = `${toAppPath('/client/login')}?redirect=${encodeURIComponent(currentPath + window.location.search)}`;
        }
      } else {
        clearStoredSession();
        if (!currentPath.startsWith(toAppPath('/login'))) {
          window.location.href = `${toAppPath('/login')}?redirect=${encodeURIComponent(currentPath + window.location.search)}`;
        }
      }
    }

    return Promise.reject(error);
  },
);

export async function request<T>(config: ExtendedRequestConfig) {
  const response = await service.request<ApiResponse<T>>(config);
  return response.data.data;
}

export async function downloadCsv(config: AxiosRequestConfig, fallbackFilename: string) {
  const response = await service.request<Blob>({
    ...config,
    responseType: 'blob',
  });

  const disposition = response.headers['content-disposition'];
  const filename = getFilenameFromDisposition(disposition) || fallbackFilename;
  const blob = new Blob([response.data], {
    type: String(response.headers['content-type'] || 'text/csv;charset=utf-8'),
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function getFilenameFromDisposition(disposition?: string) {
  if (!disposition) return '';
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const plainMatch = disposition.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] ? decodeURIComponent(plainMatch[1]) : '';
}
