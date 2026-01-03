import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 类型定义
export interface Candidate {
  id: string;
  name: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
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

  // 历史记录相关
  getHistory: (params?: { project_id?: string; limit?: number }) =>
    api.get<History[]>('/history', { params }),

  // 随机选择
  randomize: (project_id: string) =>
    api.post<RandomizeResponse>('/randomize', { project_id }),
};

export default api;
