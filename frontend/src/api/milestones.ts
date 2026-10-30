import { apiClient } from './client';
import type { Milestone } from '../types';

export interface CreateMilestonePayload {
  title: string;
  description?: string;
  planned_due_date: string;
  completion_criteria?: string;
  task_ids?: number[];
}

export interface UpdateMilestonePayload {
  title?: string;
  description?: string;
  planned_due_date?: string;
  completion_criteria?: string;
  task_ids?: number[];
}

export const milestonesApi = {
  getProjectMilestones: async (projectId: number): Promise<Milestone[]> => {
    const res = await apiClient.get<Milestone[]>(`/projects/${projectId}/milestones`);
    return res.data;
  },

  createMilestone: async (projectId: number, payload: CreateMilestonePayload): Promise<Milestone> => {
    const res = await apiClient.post<Milestone>(`/projects/${projectId}/milestones`, payload);
    return res.data;
  },

  getMilestone: async (milestoneId: number): Promise<Milestone> => {
    const res = await apiClient.get<Milestone>(`/milestones/${milestoneId}`);
    return res.data;
  },

  updateMilestone: async (milestoneId: number, payload: UpdateMilestonePayload): Promise<Milestone> => {
    const res = await apiClient.patch<Milestone>(`/milestones/${milestoneId}`, payload);
    return res.data;
  },

  submitMilestone: async (milestoneId: number, submission_notes?: string): Promise<Milestone> => {
    const res = await apiClient.post<Milestone>(`/milestones/${milestoneId}/submit`, { submission_notes });
    return res.data;
  },

  reviewMilestone: async (milestoneId: number, decision: 'Approved' | 'Revision Requested', comments?: string): Promise<Milestone> => {
    const res = await apiClient.post<Milestone>(`/milestones/${milestoneId}/review`, { decision, comments });
    return res.data;
  },
};
