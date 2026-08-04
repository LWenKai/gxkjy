import { API_BASE_URLS } from '@/config';
import { clearSession, getToken } from '@/utils/auth';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  code?: string;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: Record<string, unknown> | unknown[];
  auth?: boolean;
  silent?: boolean;
  timeout?: number;
}

const LAST_REQUEST_ERROR_KEY = 'guxin_last_request_error';

function toQueryString(data?: Record<string, unknown> | unknown[]) {
  if (!data || Array.isArray(data)) return '';
  const pairs = Object.entries(data)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  return pairs.length ? `?${pairs.join('&')}` : '';
}

function redirectToLogin() {
  clearSession();
  uni.reLaunch({ url: '/pages/login/index' });
}

function readErrorText(error: unknown) {
  const errMsg = String((error as { errMsg?: string })?.errMsg || '');
  const message = String((error as { message?: string })?.message || '');
  return `${message} ${errMsg}`.trim();
}

function saveNetworkError(url: string, error: unknown) {
  const raw = readErrorText(error);
  const payload = {
    time: new Date().toLocaleString('zh-CN', { hour12: false }),
    url,
    raw,
  };
  try {
    uni.setStorageSync(LAST_REQUEST_ERROR_KEY, payload);
  } catch {
    // ignore storage failures
  }
  console.error('[guxin request fail]', payload);
}

export function getLastRequestError() {
  try {
    return uni.getStorageSync(LAST_REQUEST_ERROR_KEY) || null;
  } catch {
    return null;
  }
}

function networkFailMessage(error: unknown) {
  const raw = readErrorText(error);
  if (raw.includes('url not in domain list') || raw.includes('domain list')) {
    return '小程序未配置接口域名，请联系管理员';
  }
  if (raw.includes('timeout') || raw.includes('超时')) {
    return '连接超时，请检查手机网络后重试';
  }
  if (raw.includes('fail ssl') || raw.includes('certificate') || raw.includes('TLS') || raw.includes('SSL')) {
    return '安全连接失败，请联系管理员检查证书';
  }
  if (raw.includes('ERR_NAME_NOT_RESOLVED') || raw.includes('name not resolved')) {
    return '域名解析失败，请检查手机网络或域名配置';
  }
  if (raw.includes('ERR_CONNECTION') || raw.includes('fail abort')) {
    return '无法连接服务器，请检查手机网络后重试';
  }
  return raw ? `网络异常：${raw.replace(/^request:fail\s*/i, '').slice(0, 36)}` : '网络异常，请稍后重试';
}

function getRequestBaseUrls() {
  const urls = [...API_BASE_URLS];
  try {
    const envVersion = uni.getAccountInfoSync?.().miniProgram?.envVersion;
    if (envVersion === 'develop') {
      urls.push('http://182.92.75.122/api');
    }
  } catch {
    // ignore runtime env detection failures
  }
  return Array.from(new Set(urls));
}

export function request<T>(path: string, options: RequestOptions = {}) {
  const method = options.method || 'GET';
  const isGet = method === 'GET';
  const token = getToken();
  const requestBaseUrls = getRequestBaseUrls();

  return new Promise<T>((resolve, reject) => {
    const send = (baseIndex: number) => {
      const baseUrl = requestBaseUrls[baseIndex] || requestBaseUrls[0];
      const url = `${baseUrl}${path}${isGet ? toQueryString(options.data as Record<string, unknown>) : ''}`;
      uni.request({
      url,
      method,
      timeout: options.timeout || 20000,
      data: isGet ? undefined : options.data,
      header: {
        'content-type': 'application/json',
        ...(options.auth === false || !token ? {} : { Authorization: `Bearer ${token}` }),
      },
      success: (res) => {
        const body = res.data as ApiResponse<T> | undefined;

        if (res.statusCode === 401) {
          if (!options.silent) uni.showToast({ title: '登录已失效，请重新登录', icon: 'none' });
          redirectToLogin();
          reject(body || res);
          return;
        }

        if (!body?.success) {
          if (!options.silent) {
            uni.showToast({ title: body?.message || '操作失败，请稍后重试', icon: 'none' });
          }
          reject(body || res);
          return;
        }

        resolve(body.data);
      },
      fail: (error) => {
        saveNetworkError(url, error);
        if (baseIndex < requestBaseUrls.length - 1) {
          send(baseIndex + 1);
          return;
        }
        const message = networkFailMessage(error);
        if (!options.silent) uni.showToast({ title: message, icon: 'none' });
        reject({ ...(error as object), message });
      },
    });
    };

    send(0);
  });
}
