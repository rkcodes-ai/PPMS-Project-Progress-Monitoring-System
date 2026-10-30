import { apiClient } from './client';
import type { PaginatedProjects, ProjectDetail, ProjectStatusEnum, ProjectPriorityEnum } from '../types';

export interface ProjectQueryParams {
  page?: number;
  size?: number;
  academic_year_id?: number;
  section_id?: number;
  category?: string;
  status?: ProjectStatusEnum;
  mentor_id?: number;
  search?: string;
}

export interface CreateProjectPayload {
  title: string;
  description: string;
  objectives?: string;
  category: string;
  academic_year_id: number;
  section_id: number;
  start_date: string;
  planned_completion_date: string;
  priority?: ProjectPriorityEnum;
  team_lead_id?: number;
  member_user_ids?: number[];
}

export interface UpdateProjectPayload {
  title?: string;
  description?: string;
  objectives?: string;
  category?: string;
  priority?: ProjectPriorityEnum;
  planned_completion_date?: string;
  mentor_id?: number;
}

export const projectsApi = {
  getProjects: async (params?: ProjectQueryParams): Promise<PaginatedProjects> => {
    const res = await apiClient.get<PaginatedProjects>('/projects', { params });
    return res.data;
  },

  getProject: async (projectId: number): Promise<ProjectDetail> => {
    const res = await apiClient.get<ProjectDetail>(`/projects/${projectId}`);
    return res.data;
  },

  createProject: async (payload: CreateProjectPayload): Promise<ProjectDetail> => {
    const res = await apiClient.post<ProjectDetail>('/projects', payload);
    return res.data;
  },

  updateProject: async (projectId: number, payload: UpdateProjectPayload): Promise<ProjectDetail> => {
    const res = await apiClient.patch<ProjectDetail>(`/projects/${projectId}`, payload);
    return res.data;
  },

  submitProject: async (projectId: number, comments?: string): Promise<ProjectDetail> => {
    const res = await apiClient.post<ProjectDetail>(`/projects/${projectId}/submit`, { comments });
    return res.data;
  },

  approveProject: async (projectId: number, comments?: string): Promise<ProjectDetail> => {
    const res = await apiClient.post<ProjectDetail>(`/projects/${projectId}/approve`, { comments });
    return res.data;
  },

  rejectProject: async (projectId: number, comments?: string): Promise<ProjectDetail> => {
    const res = await apiClient.post<ProjectDetail>(`/projects/${projectId}/reject`, { comments });
    return res.data;
  },

  exportProjectsCsv: async (): Promise<void> => {
    const res = await apiClient.get('/projects/export', {
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ppms_projects_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

