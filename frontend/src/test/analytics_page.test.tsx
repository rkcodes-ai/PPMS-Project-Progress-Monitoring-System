import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnalyticsPage } from '../features/analytics/AnalyticsPage';
import { StudentDashboard } from '../features/dashboard/StudentDashboard';
import { analyticsApi } from '../api/analytics';
import { projectsApi } from '../api/projects';
import { AuthContext } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import type { StudentAnalytics, ProjectDetail } from '../types';

vi.mock('../api/analytics', () => ({
  analyticsApi: {
    getStudentAnalytics: vi.fn(),
    getHODAnalytics: vi.fn(),
    getAdvisorAnalytics: vi.fn(),
    getMentorAnalytics: vi.fn(),
    exportDepartmentCsv: vi.fn(),
    exportMentorWorkloadCsv: vi.fn(),
    exportSectionCsv: vi.fn(),
  },
}));

vi.mock('../api/projects', () => ({
  projectsApi: {
    getProjects: vi.fn(),
    getProject: vi.fn(),
  },
}));

const mockStudentAnalytics: StudentAnalytics = {
  authorized_projects: [
    {
      id: 13,
      code: 'PRJ-2026-013',
      title: 'Smart Agriculture Monitoring Platform',
      category: 'IoT & Embedded',
      status: 'IN_PROGRESS',
      health_status: 'AT_RISK',
      progress_percentage: 40.62,
      mentor_name: 'Dr. Aruna Sharma',
      planned_completion_date: '2027-04-30T17:00:00Z',
      academic_year_id: 3,
      academic_year_name: 'Third Year',
      academic_year_number: 3,
      section_id: 7,
      section_code: 'Y3-CSE-B',
      section_name: 'CSE-B',
      team_members: [
        { id: 101, name: 'Student Lead 13', role: 'Leader' },
        { id: 102, name: 'Student Teammate 13', role: 'Member' },
      ],
    },
  ],
  assigned_tasks: [],
  upcoming_deadlines: [],
  overdue_tasks: [],
  project_milestones: [],
  report_review_status: [],
  recent_activity: [],
};

const mockProjectDetail: ProjectDetail = {
  id: 13,
  code: 'PRJ-2026-013',
  title: 'Smart Agriculture Monitoring Platform',
  description: 'IoT soil moisture telemetry node network.',
  objectives: '1. Literature review. 2. Implementation.',
  category: 'IoT & Embedded',
  department_id: 1,
  academic_year_id: 3,
  academic_year_name: 'Third Year',
  academic_period_id: 1,
  academic_period_name: '2026-2027',
  section_id: 7,
  section_code: 'Y3-CSE-B',
  team_lead_id: 101,
  team_lead: { id: 101, full_name: 'Student Lead 13', email: 'student.3b@college.edu', role: 'STUDENT' },
  mentor_id: 2,
  mentor: { id: 2, full_name: 'Dr. Aruna Sharma', email: 'mentor.sharma@college.edu', role: 'MENTOR' },
  start_date: '2026-08-01T09:00:00Z',
  planned_completion_date: '2027-04-30T17:00:00Z',
  priority: 'MEDIUM',
  status: 'IN_PROGRESS',
  progress_percentage: 40.62,
  health_status: 'AT_RISK',
  created_at: '2026-08-01T09:00:00Z',
  updated_at: '2026-10-24T12:00:00Z',
  tasks: [
    {
      id: 201,
      project_id: 13,
      title: 'System Requirements & Architecture Specification',
      description: 'Define spec.',
      assignee_id: 101,
      assignee: { id: 101, full_name: 'Student Lead 13', email: 'student.3b@college.edu', role: 'STUDENT' },
      priority: 'HIGH',
      status: 'COMPLETED',
      weight: 20.0,
      completion_fraction: 1.0,
      due_date: '2026-08-15T00:00:00Z',
      created_at: '2026-08-01T00:00:00Z',
      updated_at: '2026-08-15T00:00:00Z',
    },
    {
      id: 202,
      project_id: 13,
      title: 'Database Schema Design & Ingestion',
      description: 'Design schemas.',
      assignee_id: 101,
      assignee: { id: 101, full_name: 'Student Lead 13', email: 'student.3b@college.edu', role: 'STUDENT' },
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      weight: 30.0,
      completion_fraction: 0.75,
      due_date: '2026-09-05T00:00:00Z',
      created_at: '2026-08-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
    },
  ],
  milestones: [
    {
      id: 301,
      project_id: 13,
      title: 'Phase 1: Synopsis & System Specification',
      description: 'Formal stage 1 review.',
      target_date: '2026-08-21T00:00:00Z',
      status: 'APPROVED',
      created_at: '2026-08-01T00:00:00Z',
      updated_at: '2026-08-21T00:00:00Z',
    },
  ],
  members: [
    { id: 1, user_id: 101, role_in_team: 'Leader', user: { id: 101, full_name: 'Student Lead 13', email: 'student.3b@college.edu', role: 'STUDENT' } },
    { id: 2, user_id: 102, role_in_team: 'Member', user: { id: 102, full_name: 'Student Teammate 13', email: 'member13.y3cseb@college.edu', role: 'STUDENT' } },
  ],
  reports: [],
  documents: [],
  conversations: [],
};

const renderWithProviders = (ui: React.ReactElement, activeRole = 'STUDENT') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const mockAuthContext = {
    user: { id: 101, full_name: 'Student Lead 13', email: 'student.3b@college.edu', active_role: activeRole as any, available_roles: [activeRole as any] } as any,
    activeRole: activeRole as any,
    availableRoles: [activeRole as any],
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    switchRole: vi.fn(),
    checkSession: vi.fn(),
    refetchUser: vi.fn(),
  };

  return render(
    <AuthContext.Provider value={mockAuthContext}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ToastProvider>
            {ui}
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </AuthContext.Provider>
  );
};

describe('Analytics Page vs Dashboard Distinct Content Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders distinct Student Performance & Analytics on /analytics without duplicating Project Hub', async () => {
    vi.mocked(analyticsApi.getStudentAnalytics).mockResolvedValue(mockStudentAnalytics);
    vi.mocked(projectsApi.getProject).mockResolvedValue(mockProjectDetail);

    renderWithProviders(<AnalyticsPage />, 'STUDENT');

    await waitFor(() => {
      // Distinct page title on /analytics
      expect(screen.getByText('Student Performance & Analytics')).toBeInTheDocument();
      expect(screen.getByText('Task Effort & Weight Allocation Matrix')).toBeInTheDocument();
      expect(screen.getByText('Milestone Stage-Gate Roadmap')).toBeInTheDocument();
      expect(screen.getByText('Team Workload & Role Contribution')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();
    });

    // Verify it does NOT render the operational dashboard title
    expect(screen.queryByText('Student Project Hub')).not.toBeInTheDocument();
  });

  it('renders Student Project Hub on /dashboard', async () => {
    vi.mocked(analyticsApi.getStudentAnalytics).mockResolvedValue(mockStudentAnalytics);

    renderWithProviders(<StudentDashboard />, 'STUDENT');

    await waitFor(() => {
      expect(screen.getByText('Student Project Hub')).toBeInTheDocument();
      expect(screen.getByText('Smart Agriculture Monitoring Platform')).toBeInTheDocument();
    });

    // Verify team members render names properly without empty parentheses () ()
    expect(screen.getByText('Student Lead 13')).toBeInTheDocument();
    expect(screen.getByText('Student Teammate 13')).toBeInTheDocument();
  });

  it('renders distinct Department Strategic Analytics on /analytics for HOD without duplicating HOD Department Overview', async () => {
    const mockHODAnalytics = {
      total_projects: 325,
      in_progress_count: 163,
      completed_count: 40,
      at_risk_count: 252,
      overdue_count: 0,
      pending_reviews_count: 80,
      average_progress: 47.17,
      total_academic_years: 3,
      total_sections: 13,
      projects_by_year: [
        { year_number: 2, name: 'Second Year', count: 125, average_progress: 47.06 },
        { year_number: 3, name: 'Third Year', count: 100, average_progress: 47.56 },
        { year_number: 4, name: 'Fourth Year', count: 100, average_progress: 46.93 },
      ],
      projects_by_section: [
        { section_id: 1, section_code: 'Y2-CSE-A', section_name: 'CSE-A', count: 25, total_projects: 25, completed_projects: 3, at_risk_projects: 19, avg_progress: 47.41 },
      ],
      section_comparisons: [
        { section_id: 1, section_code: 'Y2-CSE-A', section_name: 'CSE-A', count: 25, total_projects: 25, completed_projects: 3, at_risk_projects: 19, avg_progress: 47.41 },
      ],
      projects_by_status: { COMPLETED: 40, IN_PROGRESS: 163 },
      mentor_workload: [
        { mentor_id: 2, mentor_name: 'Dr. Aruna Sharma', email: 'mentor.sharma@college.edu', project_count: 55, average_progress: 29.48 },
      ],
      years_summary: [],
    };

    vi.mocked(analyticsApi.getHODAnalytics).mockResolvedValue(mockHODAnalytics as any);

    renderWithProviders(<AnalyticsPage />, 'HOD');

    await waitFor(() => {
      // Distinct HOD Strategic Analytics Header
      expect(screen.getByText('Department Strategic Analytics & Performance Benchmarks')).toBeInTheDocument();
      expect(screen.getByText('Dept Completion Velocity')).toBeInTheDocument();
      expect(screen.getByText('Department Section Benchmark Ladder (All 13 Cohorts)')).toBeInTheDocument();
      expect(screen.getByText('Faculty Mentorship Workload & Performance Allocation')).toBeInTheDocument();
    });

    // Verify it does NOT render the operational dashboard header
    expect(screen.queryByText('HOD Department Overview')).not.toBeInTheDocument();
  });
});

