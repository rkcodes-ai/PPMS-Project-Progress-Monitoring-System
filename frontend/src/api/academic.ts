import { apiClient } from './client';
import type { DepartmentOverview, AcademicYearDetail, SectionSummary } from '../types';

export const academicApi = {
  getOverview: async (): Promise<DepartmentOverview> => {
    const res = await apiClient.get<DepartmentOverview>('/academic/overview');
    return res.data;
  },

  getYears: async (): Promise<AcademicYearDetail[]> => {
    const res = await apiClient.get<AcademicYearDetail[]>('/academic/years');
    return res.data;
  },

  getYear: async (yearId: number): Promise<AcademicYearDetail> => {
    const res = await apiClient.get<AcademicYearDetail>(`/academic/years/${yearId}`);
    return res.data;
  },

  getSection: async (sectionId: number): Promise<SectionSummary> => {
    const res = await apiClient.get<SectionSummary>(`/academic/sections/${sectionId}`);
    return res.data;
  },

  getSections: async (yearId?: number): Promise<SectionSummary[]> => {
    const params = yearId ? { academic_year_id: yearId } : undefined;
    const res = await apiClient.get<SectionSummary[]>('/academic/sections', { params });
    return res.data;
  },
};
