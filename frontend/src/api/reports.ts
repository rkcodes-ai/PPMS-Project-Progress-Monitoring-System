import { apiClient } from './client';
import type { ProgressReport, ReportStatusEnum } from '../types';

export interface CreateReportPayload {
  reporting_period: string;
  work_completed: string;
  current_challenges?: string;
  planned_next_steps: string;
  supporting_evidence?: string;
}

export interface ReviewReportPayload {
  status: ReportStatusEnum;
  comments: string;
}

export const reportsApi = {
  getProjectReports: async (projectId: number): Promise<ProgressReport[]> => {
    const res = await apiClient.get<ProgressReport[]>(`/projects/${projectId}/reports`);
    return res.data;
  },

  createReport: async (projectId: number, payload: CreateReportPayload): Promise<ProgressReport> => {
    const res = await apiClient.post<ProgressReport>(`/projects/${projectId}/reports`, payload);
    return res.data;
  },

  getReport: async (reportId: number): Promise<ProgressReport> => {
    const res = await apiClient.get<ProgressReport>(`/reports/${reportId}`);
    return res.data;
  },

  reviewReport: async (reportId: number, payload: ReviewReportPayload): Promise<ProgressReport> => {
    const res = await apiClient.post<ProgressReport>(`/reports/${reportId}/reviews`, payload);
    return res.data;
  },
};
