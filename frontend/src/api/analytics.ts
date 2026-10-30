import { apiClient } from './client';
import type { HODAnalytics, AdvisorAnalytics, MentorAnalytics, StudentAnalytics } from '../types';

export const analyticsApi = {
  getHODAnalytics: async (): Promise<HODAnalytics> => {
    const res = await apiClient.get<HODAnalytics>('/analytics/hod');
    return res.data;
  },

  getAdvisorAnalytics: async (sectionId?: number): Promise<AdvisorAnalytics> => {
    const params = sectionId ? { section_id: sectionId } : undefined;
    const res = await apiClient.get<AdvisorAnalytics>('/analytics/advisor', { params });
    return res.data;
  },

  getMentorAnalytics: async (): Promise<MentorAnalytics> => {
    const res = await apiClient.get<MentorAnalytics>('/analytics/mentor');
    return res.data;
  },

  getStudentAnalytics: async (): Promise<StudentAnalytics> => {
    const res = await apiClient.get<StudentAnalytics>('/analytics/student');
    return res.data;
  },

  exportDepartmentCsv: async (): Promise<void> => {
    const res = await apiClient.get('/analytics/export/department', {
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ppms_department_analytics_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  exportMentorWorkloadCsv: async (): Promise<void> => {
    const res = await apiClient.get('/analytics/export/mentor-workload', {
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ppms_mentor_workload_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  exportSectionCsv: async (sectionId: number, sectionCode?: string): Promise<void> => {
    const res = await apiClient.get(`/analytics/export/section/${sectionId}`, {
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ppms_section_${sectionCode || sectionId}_projects_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

