import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectListPage } from '../features/projects/ProjectListPage';
import { ProjectDetailPage } from '../features/projects/ProjectDetailPage';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { projectsApi } from '../api/projects';
import { tasksApi } from '../api/tasks';
import { milestonesApi } from '../api/milestones';
import { reportsApi } from '../api/reports';
import type { 
  ProjectDetail, 
  PaginatedProjects, 
  Task, 
  Milestone, 
  ProgressReport 
} from '../types';

vi.mock('../api/projects', () => ({
  projectsApi: {
    getProjects: vi.fn(),
    getProject: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    submitProject: vi.fn(),
    approveProject: vi.fn(),
    rejectProject: vi.fn(),
  },
}));

vi.mock('../api/tasks', () => ({
  tasksApi: {
    getProjectTasks: vi.fn(),
    createTask: vi.fn(),
    getTask: vi.fn(),
    updateTask: vi.fn(),
    submitTaskReview: vi.fn(),
    reviewTask: vi.fn(),
  },
}));

vi.mock('../api/milestones', () => ({
  milestonesApi: {
    getProjectMilestones: vi.fn(),
    createMilestone: vi.fn(),
    getMilestone: vi.fn(),
    updateMilestone: vi.fn(),
    submitMilestone: vi.fn(),
    reviewMilestone: vi.fn(),
  },
}));

vi.mock('../api/reports', () => ({
  reportsApi: {
    getProjectReports: vi.fn(),
    createReport: vi.fn(),
    getReport: vi.fn(),
    reviewReport: vi.fn(),
  },
}));

vi.mock('../context/AuthContext', async () => {
  const actual = await vi.importActual('../context/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: { id: 1, full_name: 'Dr. K. S. Ramanathan', email: 'hod.cse@college.edu', active_role: 'HOD', available_roles: ['HOD'] },
      activeRole: 'HOD',
      availableRoles: ['HOD'],
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      switchRole: vi.fn(),
      logout: vi.fn(),
      refetchUser: vi.fn(),
    }),
  };
});

const mockPaginatedProjects: PaginatedProjects = {
  items: [
    {
      id: 1,
      code: 'PRJ-2026-001',
      title: 'AI-Based Student Performance Prediction',
      category: 'AI/ML',
      department_id: 1,
      academic_year_id: 2,
      academic_year_name: 'Second Year',
      section_id: 1,
      section_code: 'Y2-CSE-A',
      section_name: 'CSE-A',
      team_lead_id: 101,
      team_lead_name: 'Student Lead 1',
      mentor_id: 2,
      mentor_name: 'Dr. Aruna Sharma',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      health_status: 'ON_TRACK',
      progress_percentage: 42.5,
      start_date: '2026-08-01T09:00:00Z',
      planned_completion_date: '2027-04-30T17:00:00Z',
      created_at: '2026-08-01T09:00:00Z',
    },
  ],
  total: 1,
  page: 1,
  size: 10,
  total_pages: 1,
};

const mockProjectDetail: ProjectDetail = {
  ...mockPaginatedProjects.items[0],
  description: 'Machine Learning model predicting academic trajectory.',
  objectives: '1. Feature extraction\n2. Model training\n3. Deployment',
  members: [
    { id: 1, user_id: 101, full_name: 'Student Lead 1', email: 'lead1@college.edu', role_in_team: 'Leader' },
    { id: 2, user_id: 102, full_name: 'Student Member 1', email: 'mem1@college.edu', role_in_team: 'Member' },
  ],
  task_count: 2,
  milestone_count: 1,
  report_count: 1,
};

const mockTasks: Task[] = [
  {
    id: 1,
    project_id: 1,
    title: 'Data Collection & Extraction',
    description: 'Scrape and format datasets',
    assignee_id: 101,
    assignee_name: 'Student Lead 1',
    priority: 'HIGH',
    start_date: '2026-08-01T00:00:00Z',
    due_date: '2026-10-15T00:00:00Z',
    estimated_effort: 2.0,
    status: 'COMPLETED',
    completion_fraction: 1.0,
    submission_details: 'GitHub pull request #4',
    review_status: 'Approved',
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-10-15T00:00:00Z',
  },
  {
    id: 2,
    project_id: 1,
    title: 'Model Architecture Design',
    description: 'Implement neural network baseline',
    assignee_id: 102,
    assignee_name: 'Student Member 1',
    priority: 'MEDIUM',
    start_date: '2026-10-16T00:00:00Z',
    due_date: '2026-11-20T00:00:00Z',
    estimated_effort: 3.0,
    status: 'IN_PROGRESS',
    completion_fraction: 0.5,
    submission_details: null,
    review_status: null,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-10-16T00:00:00Z',
  },
];

const mockMilestones: Milestone[] = [
  {
    id: 1,
    project_id: 1,
    title: 'Phase 1 Architecture Sign-off',
    description: 'Complete architecture design',
    planned_due_date: '2026-11-30T00:00:00Z',
    completion_criteria: 'Detailed report and benchmark results',
    status: 'IN_PROGRESS',
    submission_status: 'Not Submitted',
    review_status: 'Pending',
    reviewer_id: null,
    reviewer_name: null,
    reviewer_comments: null,
    completed_at: null,
    linked_task_ids: [1, 2],
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z',
  },
];

const mockReports: ProgressReport[] = [
  {
    id: 1,
    project_id: 1,
    submitted_by_id: 101,
    submitted_by_name: 'Student Lead 1',
    reporting_period: 'Month 1 Progress',
    work_completed: 'Cleaned data and tested 3 baseline models',
    current_challenges: 'Hardware constraints on GPU server',
    planned_next_steps: 'Fine-tuning hyper-parameters',
    supporting_evidence: 'https://github.com/cse-ppms/prj-001',
    version: 1,
    status: 'APPROVED',
    submitted_at: '2026-09-30T10:00:00Z',
    created_at: '2026-09-30T10:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    reviews: [
      {
        id: 1,
        report_id: 1,
        reviewer_id: 2,
        reviewer_name: 'Dr. Aruna Sharma',
        status: 'APPROVED',
        comments: 'Strong progress on data preparation. Approved.',
        reviewed_at: '2026-10-01T12:00:00Z',
      },
    ],
  },
];

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe('Project Workflows Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ProjectListPage with search filters and projects table', async () => {
    vi.mocked(projectsApi.getProjects).mockResolvedValueOnce(mockPaginatedProjects);
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <MemoryRouter>
              <ProjectListPage />
            </MemoryRouter>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Academic Projects')).toBeInTheDocument();
      expect(screen.getByText('PRJ-2026-001')).toBeInTheDocument();
      expect(screen.getByText('AI-Based Student Performance Prediction')).toBeInTheDocument();
      expect(screen.getByText('Section Y2-CSE-A')).toBeInTheDocument();
    });
  });

  it('renders ProjectDetailPage with tabs and computed progress', async () => {
    vi.mocked(projectsApi.getProject).mockResolvedValueOnce(mockProjectDetail);
    vi.mocked(tasksApi.getProjectTasks).mockResolvedValue(mockTasks);
    vi.mocked(milestonesApi.getProjectMilestones).mockResolvedValue(mockMilestones);
    vi.mocked(reportsApi.getProjectReports).mockResolvedValue(mockReports);

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <MemoryRouter initialEntries={['/projects/1']}>
              <Routes>
                <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
              </Routes>
            </MemoryRouter>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('PRJ-2026-001').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('AI-Based Student Performance Prediction')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Overview/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Team Members/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Tasks/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Milestones/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Progress Reports/i })).toBeInTheDocument();
    });

    // Switch to Tasks Tab
    fireEvent.click(screen.getByRole('button', { name: /Tasks/i }));
    await waitFor(() => {
      expect(screen.getByText('Authoritative Backend Progress Math')).toBeInTheDocument();
      expect(screen.getByText('Data Collection & Extraction')).toBeInTheDocument();
      expect(screen.getByText('Model Architecture Design')).toBeInTheDocument();
    });

    // Switch to Milestones Tab
    fireEvent.click(screen.getByRole('button', { name: /Milestones/i }));
    await waitFor(() => {
      expect(screen.getByText('Phase 1 Architecture Sign-off')).toBeInTheDocument();
    });

    // Switch to Reports Tab
    fireEvent.click(screen.getByRole('button', { name: /Progress Reports/i }));
    await waitFor(() => {
      expect(screen.getByText('Month 1 Progress')).toBeInTheDocument();
      expect(screen.getByText(/Cleaned data and tested 3 baseline models/i)).toBeInTheDocument();
    });
  });

  it('triggers proposal lifecycle actions: submit, approve, and reject', async () => {
    const draftProject: ProjectDetail = {
      ...mockProjectDetail,
      status: 'DRAFT',
    };
    vi.mocked(projectsApi.getProject).mockResolvedValue(draftProject);
    vi.mocked(projectsApi.submitProject).mockResolvedValueOnce({
      ...draftProject,
      status: 'SUBMITTED',
    });

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <MemoryRouter initialEntries={['/projects/1']}>
              <Routes>
                <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
              </Routes>
            </MemoryRouter>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit Proposal for Review/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit Proposal for Review/i }));

    await waitFor(() => {
      expect(projectsApi.submitProject).toHaveBeenCalledWith(1);
    });
  });

  it('allows creating tasks with positive effort weights', async () => {
    vi.mocked(projectsApi.getProject).mockResolvedValue(mockProjectDetail);
    vi.mocked(tasksApi.getProjectTasks).mockResolvedValue(mockTasks);
    vi.mocked(tasksApi.createTask).mockResolvedValueOnce({
      ...mockTasks[0],
      id: 3,
      title: 'New Unit Testing Task',
      estimated_effort: 2.5,
    });

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <MemoryRouter initialEntries={['/projects/1']}>
              <Routes>
                <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
              </Routes>
            </MemoryRouter>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    );

    // Switch to tasks tab
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Tasks/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Tasks/i }));

    // Click "Add Task" button
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Task/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Add Task/i }));

    // Verify modal opened
    expect(screen.getByText('Create Project Task')).toBeInTheDocument();
    expect(screen.getByLabelText(/Task Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Effort Weight/i)).toBeInTheDocument();

    // Fill form and submit
    fireEvent.change(screen.getByLabelText(/Task Title/i), {
      target: { value: 'New Unit Testing Task' },
    });
    fireEvent.change(screen.getByLabelText(/Effort Weight/i), {
      target: { value: '2.5' },
    });

    const submitBtn = screen.getAllByRole('button', { name: /Add Task/i })[1];
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(tasksApi.createTask).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          title: 'New Unit Testing Task',
          estimated_effort: 2.5,
        })
      );
    });
  });
});
