import { apiClient } from './client';

export const certificatesApi = {
  downloadProjectCertificate: async (projectId: number, projectCode: string): Promise<void> => {
    const response = await apiClient.get(`/projects/${projectId}/certificate`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Certificate_${projectCode}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  downloadMilestoneCertificate: async (milestoneId: number, milestoneTitle: string): Promise<void> => {
    const response = await apiClient.get(`/milestones/${milestoneId}/certificate`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanTitle = milestoneTitle.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    link.setAttribute('download', `Milestone_Certificate_${milestoneId}_${cleanTitle}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};
