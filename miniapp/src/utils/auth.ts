const TOKEN_KEY = 'guxin_client_token';
const USER_KEY = 'guxin_client_user';
const COMPANY_KEY = 'guxin_client_company';
const EXPIRE_WARNING_KEY = 'guxin_expire_warning';
const SAVED_USERNAME_KEY = 'guxin_client_saved_username';
const SAVED_PASSWORD_KEY = 'guxin_client_saved_password';

export interface ClientUser {
  id: string;
  company_id: string;
  username: string;
  real_name?: string | null;
  status?: string;
  last_login_at?: string;
}

export interface ClientCompany {
  id: string;
  name: string;
  contact_name?: string;
  phone?: string;
  address?: string | null;
  origin_address?: string | null;
  service_expire_at?: string;
  default_certificate_type?: string;
}

export interface ExpireWarning {
  days_left: number;
  service_expire_at: string;
}

export function getToken() {
  return uni.getStorageSync(TOKEN_KEY) as string;
}

export function setSession(params: {
  access_token: string;
  company_user: ClientUser;
  company: ClientCompany;
  expire_warning?: ExpireWarning | null;
}) {
  uni.setStorageSync(TOKEN_KEY, params.access_token);
  uni.setStorageSync(USER_KEY, params.company_user);
  uni.setStorageSync(COMPANY_KEY, params.company);
  uni.setStorageSync(EXPIRE_WARNING_KEY, params.expire_warning || null);
}

export function getClientUser() {
  return uni.getStorageSync(USER_KEY) as ClientUser | '';
}

export function getCompany() {
  return uni.getStorageSync(COMPANY_KEY) as ClientCompany | '';
}

export function setCompany(company: ClientCompany) {
  uni.setStorageSync(COMPANY_KEY, company);
}

export function getExpireWarning() {
  return uni.getStorageSync(EXPIRE_WARNING_KEY) as ExpireWarning | null;
}

export function setExpireWarning(warning: ExpireWarning | null) {
  uni.setStorageSync(EXPIRE_WARNING_KEY, warning || null);
}

export function getSavedUsername() {
  return (uni.getStorageSync(SAVED_USERNAME_KEY) as string) || '';
}

export function saveUsername(username: string) {
  if (username) uni.setStorageSync(SAVED_USERNAME_KEY, username);
}

export function clearSavedUsername() {
  uni.removeStorageSync(SAVED_USERNAME_KEY);
}

export function getSavedPassword() {
  return (uni.getStorageSync(SAVED_PASSWORD_KEY) as string) || '';
}

export function savePassword(password: string) {
  if (password) uni.setStorageSync(SAVED_PASSWORD_KEY, password);
}

export function clearSavedPassword() {
  uni.removeStorageSync(SAVED_PASSWORD_KEY);
}

export function clearSession() {
  uni.removeStorageSync(TOKEN_KEY);
  uni.removeStorageSync(USER_KEY);
  uni.removeStorageSync(COMPANY_KEY);
  uni.removeStorageSync(EXPIRE_WARNING_KEY);
}

export function ensureLogin() {
  if (!getToken()) {
    uni.reLaunch({ url: '/pages/login/index' });
    return false;
  }
  return true;
}

export function logout() {
  clearSession();
  uni.reLaunch({ url: '/pages/login/index' });
}
