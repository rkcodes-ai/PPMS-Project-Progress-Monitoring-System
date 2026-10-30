import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HODDashboard } from '../features/dashboard/HODDashboard';
import { AdvisorDashboard } from '../features/dashboard/AdvisorDashboard';
import { MentorDashboard } from '../features/dashboard/MentorDashboard';
import { StudentDashboard } from '../features/dashboard/StudentDashboard';
import { analyticsApi } from '../api/analytics';
import { ToastProvider } from '../context/ToastContext';
import type { 
  HODAnalytics, 
  AdvisorAnalytics, 
  MentorAnalytics, 
  StudentAnalytics 
} from '../types';

vi.mock('../api/analytics', () => ({
  analyticsApi: {
    getHODAnalytics: vi.fn(),
    getAdvisorAnalytics: vi.fn(),
    getMentorAnalytics: vi.fn(),
    getStudentAnalytics: vi.fn(),
    exportDepartmentCsv: vi.fn(),
    exportMentorWorkloadCsv: vi.fn(),
    exportSectionCsv: vi.fn(),
  },
}));


const mockHODData: HODAnalytics = {
  total_projects: 25,
  in_progress_count: 14,
  completed_count: 5,
  at_risk_count: 4,
  overdue_count: 2,
  pending_reviews_count: 6,
  average_progress: 58.4,
  projects_by_year: [
    { year_number: 2, name: 'Second Year', count: 10, average_progress: 45.2 },
    { year_number: 3, name: 'Third Year', count: 8, average_progress: 62.1 },
    { year_number: 4, name: 'Fourth Year', count: 7, average_progress: 71.8 },
  ],
  projects_by_section: [
    { section_id: 1, section_code: 'Y2-CSE-A', section_name: 'CSE-A', count: 2, total_projects: 2, completed_projects: 0, at_risk_projects: 0, avg_progress: 42.0 },
  ],
  projects_by_status: {
    IN_PROGRESS: 14,
    COMPLETED: 5,
    APPROVED: 3,
    DRAFT: 3,
  },
  mentor_workload: [
    { mentor_id: 2, mentor_name: 'Dr. Aruna Sharma', email: 'mentor.sharma@college.edu', project_count: 5, average_progress: 61.5 },
  ],
  section_comparisons: [
    { section_id: 1, section_code: 'Y2-CSE-A', section_name: 'CSE-A', total_projects: 2, completed_projects: 0, at_risk_projects: 0, avg_progress: 42.0 },
    { section_id: 6, section_code: 'Y3-CSE-A', section_name: 'CSE-A', total_projects: 2, completed_projects: 1, at_risk_projects: 0, avg_progress: 65.0 },
  ],
};

const mockAdvisorData: AdvisorAnalytics = {
  section_id: 1,
  section_code: 'Y2-CSE-A',
  section_name: 'CSE-A',
  total_projects: 2,
  active_projects: 2,
  completed_projects: 0,
  at_risk_projects: 0,
  overdue_tasks_count: 1,
  pending_reviews_count: 2,
  section_average_progress: 42.5,
  projects_by_status: {
    IN_PROGRESS: 2,
  },
  upcoming_deadlines: [
    {
      type: 'Milestone',
      title: 'Phase 1 Architecture',
      project_code: 'PRJ-2026-001',
      project_title: 'AI-Based Student Performance Prediction',
      due_date: '2026-11-15T00:00:00Z',
    },
  ],
  projects: [
    {
      id: 1,
      code: 'PRJ-2026-001',
      title: 'AI-Based Student Performance Prediction',
      status: 'IN_PROGRESS',
      health_status: 'ON_TRACK',
      progress_percentage: 42.5,
      team_lead: 'Student Lead 1',
      mentor: 'Dr. Aruna Sharma',
    },
  ],
};

const mockMentorData: MentorAnalytics = {
  assigned_projects_count: 5,
  pending_reviews_count: 2,
  at_risk_count: 1,
  completed_count: 1,
  average_progress: 61.5,
  assigned_projects: [
    {
      id: 1,
      code: 'PRJ-2026-001',
      title: 'AI-Based Student Performance Prediction',
      status: 'IN_PROGRESS',
      health_status: 'ON_TRACK',
      progress_percentage: 42.5,
      team_lead_name: 'Student Lead 1',
      section_code: 'Y2-CSE-A',
    },
  ],
  upcoming_milestones: [
    {
      id: 1,
      title: 'Phase 1 Deliverable',
      project_code: 'PRJ-2026-001',
      project_title: 'AI-Based Student Performance Prediction',
      planned_due_date: '2026-11-20T00:00:00Z',
      status: 'PENDING',
      submission_status: 'Not Submitted',
    },
  ],
  pending_reports: [
    {
      id: 1,
      project_code: 'PRJ-2026-001',
      project_title: 'AI-Based Student Performance Prediction',
      reporting_period: 'Month 1 Progress',
      submitted_by: 'Student Lead 1',
      submitted_at: '2026-10-20T10:00:00Z',
    },
  ],
  overdue_tasks: [
    {
      id: 101,
      title: 'Dataset Validation',
      project_code: 'PRJ-2026-001',
      assignee: 'Student Lead 1',
      due_date: '2026-10-15T00:00:00Z',
      priority: 'HIGH',
    },
  ],
};

const mockStudentData: StudentAnalytics = {
  authorized_projects: [
    {
      id: 1,
      code: 'PRJ-2026-001',
      title: 'AI-Based Student Performance Prediction',
      category: 'AI/ML',
      status: 'IN_PROGRESS',
      health_status: 'ON_TRACK',
      progress_percentage: 42.5,
      mentor_name: 'Dr. Aruna Sharma',
      planned_completion_date: '2027-04-30T00:00:00Z',
    },
  ],
  assigned_tasks: [
    {
      id: 101,
      title: 'Data Collection & Preprocessing',
      project_id: 1,
      project_code: 'PRJ-2026-001',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      completion_fraction: 0.6,
      due_date: '2026-11-10T00:00:00Z',
    },
  ],
  upcoming_deadlines: [
    {
      type: 'Task',
      title: 'Data Collection & Preprocessing',
      project_code: 'PRJ-2026-001',
      due_date: '2026-11-10T00:00:00Z',
      priority: 'HIGH',
    },
  ],
  overdue_tasks: [],
  project_milestones: [
    {
      id: 1,
      title: 'Phase 1 Architecture',
      project_code: 'PRJ-2026-001',
      status: 'IN_PROGRESS',
      submission_status: 'Not Submitted',
      review_status: 'Pending',
      planned_due_date: '2026-11-15T00:00:00Z',
    },
  ],
  report_review_status: [
    {
      id: 1,
      project_code: 'PRJ-2026-001',
      reporting_period: 'Month 1 Progress',
      status: 'APPROVED',
      feedback: 'Excellent feature extraction pipeline. Approved.',
      reviewer: 'Dr. Aruna Sharma',
    },
  ],
  recent_activity: [
    {
      id: 1,
      activity_type: 'TASK_UPDATED',
      description: 'Task Data Collection updated.',
      timestamp: '2026-10-24T12:00:00Z',
    },
  ],
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithProviders = (ui: React.ReactElement, client = createTestQueryClient()) => {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ToastProvider>
          {ui}
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Role-Specific Dashboards Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders HOD dashboard with department metrics, 25 projects KPI, and section comparisons', async () => {
    vi.mocked(analyticsApi.getHODAnalytics).mockResolvedValueOnce(mockHODData);
    renderWithProviders(<HODDashboard />);

    await waitFor(() => {
      expect(screen.getByText('HOD Department Overview')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('All 13 Sections')).toBeInTheDocument();
      expect(screen.getByText('Academic Year Comparison')).toBeInTheDocument();
      expect(screen.getByText('Department Section Benchmark (13 Sections)')).toBeInTheDocument();
      expect(screen.getByText('Dr. Aruna Sharma')).toBeInTheDocument();
    });
  });

  it('renders Advisor dashboard scoped to assigned section', async () => {
    vi.mocked(analyticsApi.getAdvisorAnalytics).mockResolvedValueOnce(mockAdvisorData);
    renderWithProviders(<AdvisorDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Section Advisor Overview')).toBeInTheDocument();
      expect(screen.getByText(/Section Y2-CSE-A/i)).toBeInTheDocument();
      expect(screen.getByText('Section Project Portfolio')).toBeInTheDocument();
      expect(screen.getByText('AI-Based Student Performance Prediction')).toBeInTheDocument();
    });
  });

  it('renders Mentor dashboard with assigned portfolio and review queue', async () => {
    vi.mocked(analyticsApi.getMentorAnalytics).mockResolvedValueOnce(mockMentorData);
    renderWithProviders(<MentorDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Faculty Mentor Supervision')).toBeInTheDocument();
      expect(screen.getByText('Student Reports Awaiting Evaluation')).toBeInTheDocument();
      expect(screen.getByText('Month 1 Progress')).toBeInTheDocument();
      expect(screen.getByText('Overdue Tasks Across Supervised Teams')).toBeInTheDocument();
      expect(screen.getByText('Dataset Validation')).toBeInTheDocument();
    });
  });

  it('renders Student dashboard with personal tasks, progress bar, and faculty feedback', async () => {
    vi.mocked(analyticsApi.getStudentAnalytics).mockResolvedValueOnce(mockStudentData);
    renderWithProviders(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Student Project Hub')).toBeInTheDocument();
      expect(screen.getByText('AI-Based Student Performance Prediction')).toBeInTheDocument();
      expect(screen.getByText('Authoritative Computed Progress')).toBeInTheDocument();
      expect(screen.getByText('Data Collection & Preprocessing')).toBeInTheDocument();
      expect(screen.getByText(/Excellent feature extraction pipeline. Approved./i)).toBeInTheDocument();
    });
  });
});

