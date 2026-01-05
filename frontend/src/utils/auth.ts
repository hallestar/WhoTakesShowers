import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const TOKEN_KEY = 'whotakesshowers_token';
const USER_KEY = 'whotakesshowers_user';

export interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// 获取token
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// 保存token
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

// 移除token
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// 获取用户信息
export const getUser = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};

// 保存用户信息
export const setUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// 检查是否已登录
export const isAuthenticated = (): boolean => {
  return getToken() !== null;
};

// 注册
export const register = async (username: string, email: string, password: string): Promise<AuthResponse> => {
  const response = await axios.post<AuthResponse>(`${API_BASE_URL}/api/auth/register`, {
    username,
    email,
    password,
  });
  return response.data;
};

// 登录
export const login = async (username: string, password: string): Promise<AuthResponse> => {
  const response = await axios.post<AuthResponse>(`${API_BASE_URL}/api/auth/login`, {
    username,
    password,
  });
  return response.data;
};

// 登出
export const logout = (): void => {
  removeToken();
  window.location.href = '/login';
};

// 保存登录信息
export const saveAuth = (authResponse: AuthResponse): void => {
  setToken(authResponse.token);
  setUser(authResponse.user);
};
