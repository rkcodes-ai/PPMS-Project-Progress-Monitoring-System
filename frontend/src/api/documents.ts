import { apiClient } from './client';
import type { DocumentItem } from '../types';

export const documentsApi = {
  getProjectDocuments: async (projectId: number): Promise<DocumentItem[]> => {
    const res = await apiClient.get<DocumentItem[]>(`/projects/${projectId}/documents`);
    return res.data;
  },

  uploadDocument: async (
    projectId: number,
    formData: FormData
  ): Promise<DocumentItem> => {
    const res = await apiClient.post<DocumentItem>(
      `/projects/${projectId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return res.data;
  },

  downloadDocument: async (documentId: number, originalFilename: string): Promise<void> => {
    const res = await apiClient.get(`/documents/${documentId}/download`, {
      responseType: 'blob',
    });
    const contentType = (res.headers['content-type'] as string) || 'application/octet-stream';
    const blob = new Blob([res.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = originalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  deleteDocument: async (documentId: number): Promise<{ detail: string; document_id: number }> => {
    const res = await apiClient.delete<{ detail: string; document_id: number }>(`/documents/${documentId}`);
    return res.data;
  },

  fetchDocumentBlob: async (documentId: number): Promise<{ blobUrl: string; contentType: string }> => {
    const res = await apiClient.get(`/documents/${documentId}/preview`, {
      responseType: 'blob',
    });
    const contentType = (res.headers['content-type'] as string) || 'application/pdf';
    const blob = new Blob([res.data], { type: contentType });
    const blobUrl = window.URL.createObjectURL(blob);
    return { blobUrl, contentType };
  },
};
