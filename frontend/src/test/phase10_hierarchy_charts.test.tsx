import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HODDashboard } from '../features/dashboard/HODDashboard';
import { AdvisorDashboard } from '../features/dashboard/AdvisorDashboard';
import { MentorDashboard } from '../features/dashboard/MentorDashboard';
import { analyticsApi } from '../api/analytics';
import { ToastProvider } from '../context/ToastContext';
import type { 
  HODAnalytics, 
  AdvisorAnalytics, 
  MentorAnalytics, 
  AcademicYearDetail,
  SectionSummary
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

vi.mock('../api/academic', () => ({
  academicApi: {
    getDepartmentOverview: vi.fn(),
    getYears: vi.fn(),
    getYearDetail: vi.fn(),
    getSections: vi.fn(),
    getSectionDetail: vi.fn(),
  },
}));

const mockSectionsY2: SectionSummary[] = [
  { id: 1, name: 'CSE-A', code: 'Y2-CSE-A', academic_year_id: 2, academic_year_number: 2, academic_year_name: 'Second Year', total_projects: 25, active_projects: 18, completed_projects: 5, at_risk_projects: 2, pending_reviews_count: 3, average_progress: 52.0 },
  { id: 2, name: 'CSE-B', code: 'Y2-CSE-B', academic_year_id: 2, academic_year_number: 2, academic_year_name: 'Second Year', total_projects: 25, active_projects: 17, completed_projects: 6, at_risk_projects: 2, pending_reviews_count: 2, average_progress: 55.0 },
  { id: 3, name: 'CSE-C', code: 'Y2-CSE-C', academic_year_id: 2, academic_year_number: 2, academic_year_name: 'Second Year', total_projects: 25, active_projects: 19, completed_projects: 4, at_risk_projects: 2, pending_reviews_count: 4, average_progress: 49.0 },
  { id: 4, name: 'CSE-D', code: 'Y2-CSE-D', academic_year_id: 2, academic_year_number: 2, academic_year_name: 'Second Year', total_projects: 25, active_projects: 16, completed_projects: 7, at_risk_projects: 2, pending_reviews_count: 1, average_progress: 58.0 },
  { id: 5, name: 'CSE-E', code: 'Y2-CSE-E', academic_year_id: 2, academic_year_number: 2, academic_year_name: 'Second Year', total_projects: 25, active_projects: 20, completed_projects: 3, at_risk_projects: 2, pending_reviews_count: 5, average_progress: 46.0 },
];

const mockYear2: AcademicYearDetail = {
  id: 2,
  year_number: 2,
  name: 'Second Year',
  sections_count: 5,
  total_projects: 125,
  active_projects: 90,
  completed_projects: 25,
  at_risk_projects: 10,
  pending_reviews_count: 15,
  average_progress: 52.0,
  sections: mockSectionsY2,
};

const mockHODPhase10Data: HODAnalytics = {
  total_projects: 325,
  in_progress_count: 220,
  completed_count: 75,
  at_risk_count: 30,
  overdue_count: 12,
  pending_reviews_count: 35,
  average_progress: 60.5,
  total_academic_years: 3,
  total_sections: 13,
  years_summary: [
    mockYear2,
    { id: 3, year_number: 3, name: 'Third Year', sections_count: 4, total_projects: 100, active_projects: 70, completed_projects: 22, at_risk_projects: 8, pending_reviews_count: 10, average_progress: 63.0, sections: [] },
    { id: 4, year_number: 4, name: 'Fourth Year', sections_count: 4, total_projects: 100, active_projects: 60, completed_projects: 28, at_risk_projects: 12, pending_reviews_count: 10, average_progress: 66.5, sections: [] },
  ],
  projects_by_year: [
    { year_number: 2, name: 'Second Year', count: 125, average_progress: 52.0 },
    { year_number: 3, name: 'Third Year', count: 100, average_progress: 63.0 },
    { year_number: 4, name: 'Fourth Year', count: 100, average_progress: 66.5 },
  ],
  projects_by_section: mockSectionsY2.map(s => ({
    section_id: s.id,
    section_code: s.code,
    section_name: s.name,
    count: s.total_projects,
    total_projects: s.total_projects,
    completed_projects: s.completed_projects,
    at_risk_projects: s.at_risk_projects,
    avg_progress: s.average_progress,
  })),
  projects_by_status: {
    IN_PROGRESS: 220,
    COMPLETED: 75,
    APPROVED: 20,
    DRAFT: 10,
  },
  mentor_workload: [
    { mentor_id: 2, mentor_name: 'Dr. Aruna Sharma', email: 'mentor.sharma@college.edu', project_count: 25, average_progress: 61.5 },
  ],
  section_comparisons: mockSectionsY2.map(s => ({
    section_id: s.id,
    section_code: s.code,
    section_name: s.name,
    total_projects: s.total_projects,
    completed_projects: s.completed_projects,
    at_risk_projects: s.at_risk_projects,
    avg_progress: s.average_progress,
  })),
};

const createTestClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderWithProviders = (ui: React.ReactElement) => render(
  <QueryClientProvider client={createTestClient()}>
    <MemoryRouter>
      <ToastProvider>
        {ui}
      </ToastProvider>
    </MemoryRouter>
  </QueryClientProvider>
);

describe('PPMS Phase 10 — Academic Hierarchy & Zero-Charts Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('verifies 3-level academic hierarchy navigation in HOD Dashboard', async () => {
    vi.mocked(analyticsApi.getHODAnalytics).mockResolvedValueOnce(mockHODPhase10Data);
    renderWithProviders(<HODDashboard />);

    // Level 1: Department Overview
    await waitFor(() => {
      expect(screen.getByText('HOD Department Overview')).toBeInTheDocument();
      expect(screen.getByText('325 Total Projects')).toBeInTheDocument();
      expect(screen.getByText('Second Year')).toBeInTheDocument();
      expect(screen.getByText('Third Year')).toBeInTheDocument();
      expect(screen.getByText('Fourth Year')).toBeInTheDocument();
    });

    // Level 2: Drill down into Second Year Dashboard
    const yearCardBtn = screen.getByText('Explore Second Year Dashboard');
    fireEvent.click(yearCardBtn);

    await waitFor(() => {
      expect(screen.getByText(/Academic Dashboard/i)).toBeInTheDocument();
      expect(screen.getAllByText('125').length).toBeGreaterThanOrEqual(1);
      // Year 2 has 5 sections
      expect(screen.getByText('Section CSE-A')).toBeInTheDocument();
      expect(screen.getByText('Section CSE-B')).toBeInTheDocument();
      expect(screen.getByText('Section CSE-C')).toBeInTheDocument();
      expect(screen.getByText('Section CSE-D')).toBeInTheDocument();
      expect(screen.getByText('Section CSE-E')).toBeInTheDocument();
    });

    // Back to department overview
    const backBtn = screen.getByText('Back to Department');
    fireEvent.click(backBtn);

    await waitFor(() => {
      expect(screen.getByText('HOD Department Overview')).toBeInTheDocument();
    });
  });

  it('strictly verifies NO bar charts or pie charts are rendered anywhere in HODDashboard', async () => {
    vi.mocked(analyticsApi.getHODAnalytics).mockResolvedValueOnce(mockHODPhase10Data);
    const { container } = renderWithProviders(<HODDashboard />);

    await waitFor(() => {
      expect(screen.getByText('HOD Department Overview')).toBeInTheDocument();
    });

    // Assert absence of any recharts elements or canvas charts
    expect(container.querySelector('.recharts-surface')).toBeNull();
    expect(container.querySelector('.recharts-bar-rectangle')).toBeNull();
    expect(container.querySelector('.recharts-pie')).toBeNull();
    expect(container.querySelector('canvas')).toBeNull();
  });

  it('strictly verifies NO bar charts or pie charts are rendered in AdvisorDashboard', async () => {
    const mockAdvisorData: AdvisorAnalytics = {
      section_id: 1,
      section_code: 'Y2-CSE-A',
      section_name: 'CSE-A',
      academic_year_name: 'Second Year',
      academic_year_code: 'Y2',
      total_projects: 25,
      active_projects: 18,
      completed_projects: 5,
      at_risk_projects: 2,
      overdue_tasks_count: 1,
      pending_reviews_count: 3,
      section_average_progress: 52.0,
      projects_by_status: { IN_PROGRESS: 18, COMPLETED: 5, AT_RISK: 2 },
      upcoming_deadlines: [],
      projects: [
        { id: 1, code: 'PRJ-2026-001', title: 'Predictive Analytics', status: 'IN_PROGRESS', health_status: 'ON_TRACK', progress_percentage: 52, team_lead: 'Student Lead', mentor: 'Dr. Sharma' },
      ],
      assigned_sections: [
        { section_id: 1, section_code: 'Y2-CSE-A', section_name: 'CSE-A', academic_year_id: 2, academic_year_number: 2, academic_year_name: 'Second Year', total_projects: 25 },
      ],
    };

    vi.mocked(analyticsApi.getAdvisorAnalytics).mockResolvedValueOnce(mockAdvisorData);
    const { container } = renderWithProviders(<AdvisorDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Section Advisor Overview')).toBeInTheDocument();
      expect(screen.getByText('25 Projects')).toBeInTheDocument();
    });

    expect(container.querySelector('.recharts-surface')).toBeNull();
    expect(container.querySelector('.recharts-pie')).toBeNull();
    expect(container.querySelector('canvas')).toBeNull();
  });

  it('strictly verifies MentorDashboard groups projects by academic year and section with zero charts', async () => {
    const mockMentorData: MentorAnalytics = {
      assigned_projects_count: 25,
      pending_reviews_count: 5,
      at_risk_count: 2,
      completed_count: 6,
      average_progress: 58.5,
      assigned_projects: [
        { id: 1, code: 'PRJ-2026-001', title: 'Research Project 1', status: 'IN_PROGRESS', health_status: 'ON_TRACK', progress_percentage: 58, team_lead_name: 'Lead 1', section_code: 'Y2-CSE-A', academic_year_code: 'Y2' },
      ],
      projects_by_year_and_section: [
        { year_name: 'Second Year', year_code: 'Y2', section_id: 1, section_code: 'Y2-CSE-A', section_name: 'CSE-A', projects_count: 5, projects: [] },
        { year_name: 'Third Year', year_code: 'Y3', section_id: 6, section_code: 'Y3-CSE-A', section_name: 'CSE-A', projects_count: 4, projects: [] },
      ],
      upcoming_milestones: [],
      pending_reports: [],
      overdue_tasks: [],
    };

    vi.mocked(analyticsApi.getMentorAnalytics).mockResolvedValueOnce(mockMentorData);
    const { container } = renderWithProviders(<MentorDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Faculty Mentor Supervision')).toBeInTheDocument();
      expect(screen.getByText(/All Cohorts \(25\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Y2 - Sec Y2-CSE-A \(5\)/i)).toBeInTheDocument();
    });

    expect(container.querySelector('.recharts-surface')).toBeNull();
    expect(container.querySelector('.recharts-pie')).toBeNull();
    expect(container.querySelector('canvas')).toBeNull();
  });
});
