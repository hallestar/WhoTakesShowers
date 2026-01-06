import axios from 'axios';
import { getToken } from './utils/auth';

// 从环境变量读取 API 地址，支持开发环境动态配置
const getApiBaseUrl = () => {
  // 优先使用环境变量（由 Vite 提供）
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  if (envApiUrl) {
    // 如果环境变量已包含 /api，直接使用
    return envApiUrl.endsWith('/api') ? envApiUrl : `${envApiUrl}/api`;
  }
  // 默认使用相对路径（生产环境）或本地开发地址
  return import.meta.env.DEV ? 'http://localhost:8080/api' : '/api';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：自动添加Token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理401错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token过期或无效，清除本地存储并跳转到登录页
      localStorage.removeItem('whotakesshowers_token');
      localStorage.removeItem('whotakesshowers_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 输出当前使用的 API 地址（开发时方便调试）
if (import.meta.env.DEV) {
  console.log('🔧 API Base URL:', API_BASE_URL);
}

// 类型定义
export interface Candidate {
  id: string;
  name: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CandidatePhoto {
  id: string;
  candidate_id: string;
  photo_url: string;
  is_avatar: boolean;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  candidate_ids: string;
  created_at: string;
  updated_at: string;
}

export interface History {
  id: string;
  project_id: string;
  project_name: string;
  candidate_id: string;
  candidate_name: string;
  selected_at: string;
  user_id: string;
}

export interface RandomizeResponse {
  candidate_id: string;
  candidate_name: string;
}

// API 方法
export const apiClient = {
  // 项目相关
  getProjects: () => api.get<Project[]>('/projects'),
  getProject: (id: string) => api.get<Project>(`/projects/${id}`),
  createProject: (data: { name: string; candidate_ids: string[] }) =>
    api.post<Project>('/projects', data),
  updateProject: (id: string, data: { name?: string; candidate_ids?: string[] }) =>
    api.put<Project>(`/projects/${id}`, data),
  deleteProject: (id: string) => api.delete(`/projects/${id}`),

  // 候选人相关
  getCandidates: () => api.get<Candidate[]>('/candidates'),
  getCandidate: (id: string) => api.get<Candidate>(`/candidates/${id}`),
  createCandidate: (data: { name: string; photo_url?: string }) =>
    api.post<Candidate>('/candidates', data),
  updateCandidate: (id: string, data: { name?: string; photo_url?: string }) =>
    api.put<Candidate>(`/candidates/${id}`, data),
  deleteCandidate: (id: string) => api.delete(`/candidates/${id}`),
  uploadCandidatePhoto: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    return api.post<{ photo_url: string }>(`/candidates/${id}/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 候选人照片相关
  getCandidatePhotos: (id: string) => api.get(`/candidates/${id}/photos`),
  uploadCandidatePhotos: (id: string, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('photos', file));
    return api.post(`/candidates/${id}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  setCandidateAvatar: (id: string, photo_id: string) =>
    api.put(`/candidates/${id}/avatar`, { photo_id }),
  deleteCandidatePhoto: (candidateId: string, photoId: string) =>
    api.delete(`/candidates/${candidateId}/photos/${photoId}`),

  // 历史记录相关
  getHistory: (params?: { project_id?: string; limit?: number }) =>
    api.get<History[]>('/history', { params }),

  // 随机选择
  randomize: (project_id: string) =>
    api.post<RandomizeResponse>('/randomize', { project_id }),
};

export default api;
