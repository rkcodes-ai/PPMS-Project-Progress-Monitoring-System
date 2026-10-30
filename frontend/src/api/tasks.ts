import { apiClient } from './client';
import type { Task, TaskPriorityEnum, TaskStatusEnum } from '../types';

export interface CreateTaskPayload {
  title: string;
  description?: string;
  assignee_id?: number;
  priority?: TaskPriorityEnum;
  start_date?: string;
  due_date: string;
  estimated_effort?: number;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  assignee_id?: number;
  priority?: TaskPriorityEnum;
  start_date?: string;
  due_date?: string;
  estimated_effort?: number;
  status?: TaskStatusEnum;
  completion_fraction?: number;
  submission_details?: string;
}

export const tasksApi = {
  getProjectTasks: async (projectId: number): Promise<Task[]> => {
    const res = await apiClient.get<Task[]>(`/projects/${projectId}/tasks`);
    return res.data;
  },

  createTask: async (projectId: number, payload: CreateTaskPayload): Promise<Task> => {
    const res = await apiClient.post<Task>(`/projects/${projectId}/tasks`, payload);
    return res.data;
  },

  getTask: async (taskId: number): Promise<Task> => {
    const res = await apiClient.get<Task>(`/tasks/${taskId}`);
    return res.data;
  },

  updateTask: async (taskId: number, payload: UpdateTaskPayload): Promise<Task> => {
    const res = await apiClient.patch<Task>(`/tasks/${taskId}`, payload);
    return res.data;
  },

  submitTaskReview: async (taskId: number, submission_details: string): Promise<Task> => {
    const res = await apiClient.post<Task>(`/tasks/${taskId}/submit-review`, { submission_details });
    return res.data;
  },

  reviewTask: async (taskId: number, decision: 'Approved' | 'Changes Requested', comments?: string): Promise<Task> => {
    const res = await apiClient.post<Task>(`/tasks/${taskId}/review`, { decision, comments });
    return res.data;
  },
};
