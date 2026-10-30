import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectListPage } from '../features/projects/ProjectListPage';
import { HODDashboard } from '../features/dashboard/HODDashboard';
import { AdvisorDashboard } from '../features/dashboard/AdvisorDashboard';
import { projectsApi } from '../api/projects';
import { analyticsApi } from '../api/analytics';
import { ToastProvider } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import type { UserProfile, HODAnalytics, AdvisorAnalytics } from '../types';

vi.mock('../api/projects', () => ({
  projectsApi: {
    getProjects: vi.fn(),
    exportProjectsCsv: vi.fn(),
  },
}));

vi.mock('../api/analytics', () => ({
  analyticsApi: {
    getHODAnalytics: vi.fn(),
    getAdvisorAnalytics: vi.fn(),
    exportDepartmentCsv: vi.fn(),
    exportMentorWorkloadCsv: vi.fn(),
    exportSectionCsv: vi.fn(),
  },
}));

const mockHODUser: UserProfile = {
  id: 1,
  email: 'hod.cse@college.edu',
  username: 'hod_cse',
  full_name: 'Dr. Ramesh Kumar',
  is_active: true,
  active_role: 'HOD',
  available_roles: ['HOD'],
  created_at: '2026-09-01T00:00:00Z',
};

const mockHODAnalytics: HODAnalytics = {
  total_projects: 25,
  in_progress_count: 14,
  completed_count: 5,
  at_risk_count: 4,
  overdue_count: 2,
  pending_reviews_count: 6,
  average_progress: 58.4,
  projects_by_year: [],
  projects_by_section: [],
  projects_by_status: { IN_PROGRESS: 14 },
  mentor_workload: [],
  section_comparisons: [],
};

const mockAdvisorAnalytics: AdvisorAnalytics = {
  section_id: 1,
  section_code: 'Y2-CSE-A',
  section_name: 'CSE-A',
  total_projects: 2,
  active_projects: 2,
  completed_projects: 0,
  at_risk_projects: 0,
  overdue_tasks_count: 0,
  pending_reviews_count: 1,
  section_average_progress: 42.5,
  projects_by_status: { IN_PROGRESS: 2 },
  upcoming_deadlines: [],
  projects: [],
};

describe('CSV Exports Feature Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('triggers exportProjectsCsv when clicking Export CSV in ProjectListPage', async () => {
    vi.mocked(projectsApi.getProjects).mockResolvedValueOnce({
      items: [],
      total: 0,
      page: 1,
      size: 10,
      total_pages: 1,
    });
    vi.mocked(projectsApi.exportProjectsCsv).mockResolvedValueOnce();

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const mockAuthContext = {
      user: mockHODUser,
      token: 'test-token',
      activeRole: mockHODUser.active_role,
      availableRoles: mockHODUser.available_roles,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      switchRole: vi.fn(),
      refetchUser: vi.fn(),
    };


    render(
      <AuthContext.Provider value={mockAuthContext}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <ToastProvider>
              <ProjectListPage />
            </ToastProvider>
          </MemoryRouter>
        </QueryClientProvider>
      </AuthContext.Provider>
    );

    const exportBtn = await screen.findByRole('button', { name: /Export CSV/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(projectsApi.exportProjectsCsv).toHaveBeenCalled();
    });
  });

  it('triggers exportDepartmentCsv when clicking Export Dept CSV in HODDashboard', async () => {
    vi.mocked(analyticsApi.getHODAnalytics).mockResolvedValueOnce(mockHODAnalytics);
    vi.mocked(analyticsApi.exportDepartmentCsv).mockResolvedValueOnce();

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ToastProvider>
            <HODDashboard />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const exportDeptBtn = await screen.findByRole('button', { name: /Export Dept CSV/i });
    fireEvent.click(exportDeptBtn);

    await waitFor(() => {
      expect(analyticsApi.exportDepartmentCsv).toHaveBeenCalled();
    });
  });

  it('triggers exportMentorWorkloadCsv when clicking Export Mentors CSV in HODDashboard', async () => {
    vi.mocked(analyticsApi.getHODAnalytics).mockResolvedValueOnce(mockHODAnalytics);
    vi.mocked(analyticsApi.exportMentorWorkloadCsv).mockResolvedValueOnce();

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ToastProvider>
            <HODDashboard />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const exportMentorsBtn = await screen.findByRole('button', { name: /Export Mentors CSV/i });
    fireEvent.click(exportMentorsBtn);

    await waitFor(() => {
      expect(analyticsApi.exportMentorWorkloadCsv).toHaveBeenCalled();
    });
  });

  it('triggers exportSectionCsv when clicking Export Section CSV in AdvisorDashboard', async () => {
    vi.mocked(analyticsApi.getAdvisorAnalytics).mockResolvedValueOnce(mockAdvisorAnalytics);
    vi.mocked(analyticsApi.exportSectionCsv).mockResolvedValueOnce();

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ToastProvider>
            <AdvisorDashboard />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const exportSectionBtn = await screen.findByRole('button', { name: /Export Section CSV/i });
    fireEvent.click(exportSectionBtn);

    await waitFor(() => {
      expect(analyticsApi.exportSectionCsv).toHaveBeenCalledWith(1, 'Y2-CSE-A');
    });
  });
});
