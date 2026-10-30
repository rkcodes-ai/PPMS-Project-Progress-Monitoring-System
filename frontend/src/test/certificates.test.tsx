import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MilestonesTab } from '../features/milestones/MilestonesTab';
import { DocumentsTab } from '../features/documents/DocumentsTab';
import { ProjectDetailPage } from '../features/projects/ProjectDetailPage';
import { certificatesApi } from '../api/certificates';
import { milestonesApi } from '../api/milestones';
import { documentsApi } from '../api/documents';
import { projectsApi } from '../api/projects';
import { ToastProvider } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import type { ProjectDetail, Milestone, DocumentItem, UserProfile } from '../types';

vi.mock('../api/certificates', () => ({
  certificatesApi: {
    downloadProjectCertificate: vi.fn(),
    downloadMilestoneCertificate: vi.fn(),
  },
}));

vi.mock('../api/milestones', () => ({
  milestonesApi: {
    getProjectMilestones: vi.fn(),
  },
}));

vi.mock('../api/documents', () => ({
  documentsApi: {
    getProjectDocuments: vi.fn(),
    fetchDocumentBlob: vi.fn(),
    downloadDocument: vi.fn(),
    deleteDocument: vi.fn(),
  },
}));

vi.mock('../api/projects', () => ({
  projectsApi: {
    getProject: vi.fn(),
    submitProject: vi.fn(),
    approveProject: vi.fn(),
    rejectProject: vi.fn(),
  },
}));

const mockUser: UserProfile = {
  id: 10,
  email: 'student_lead_1@college.edu',
  username: 'student_lead_1',
  full_name: 'Aarav Patel',
  is_active: true,
  active_role: 'STUDENT',
  available_roles: ['STUDENT'],
  created_at: '2026-09-01T00:00:00Z',
};

const mockProjectCompleted: ProjectDetail = {
  id: 6,
  code: 'PRJ-2026-006',
  title: 'Secure Healthcare Records on Decentralized Ledger',
  category: 'Blockchain & Security',
  department_id: 1,
  academic_year_id: 1,
  academic_year_name: 'Second Year',
  section_id: 3,
  section_code: 'Y2-CSE-C',
  section_name: 'CSE-C',
  team_lead_id: 10,
  team_lead_name: 'Aarav Patel',
  mentor_id: 2,
  mentor_name: 'Dr. Aruna Sharma',
  priority: 'CRITICAL',
  status: 'COMPLETED',
  health_status: 'COMPLETED',
  progress_percentage: 100.0,
  start_date: '2026-09-01T00:00:00Z',
  planned_completion_date: '2027-04-30T00:00:00Z',
  created_at: '2026-09-01T00:00:00Z',
  description: 'Healthcare record management system.',
  objectives: 'Ensure immutable audit logs.',
  members: [],
  task_count: 5,
  milestone_count: 4,
  report_count: 3,
};

const mockMilestoneApproved: Milestone = {
  id: 1,
  project_id: 6,
  title: 'Phase 1: Synopsis & System Specification',
  description: 'Formal architectural specification',
  planned_due_date: '2026-08-21T09:00:00Z',
  completion_criteria: 'All functional requirements signed off',
  status: 'APPROVED',
  submission_status: 'Submitted',
  review_status: 'Approved',
  reviewer_name: 'Dr. Aruna Sharma',
  reviewer_comments: 'Excellent requirements breakdown.',
  completed_at: '2026-08-20T10:00:00Z',
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-20T10:00:00Z',
  linked_task_ids: [],
};

const mockMilestonePending: Milestone = {
  id: 2,
  project_id: 6,
  title: 'Phase 2: Alpha Prototype & Architecture Review',
  description: 'Working Alpha prototype',
  planned_due_date: '2026-10-25T09:00:00Z',
  completion_criteria: 'Core APIs functioning',
  status: 'PENDING',
  submission_status: 'Not Submitted',
  review_status: 'Pending',
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-01T00:00:00Z',
  linked_task_ids: [],
};

const mockDoc: DocumentItem = {
  id: 201,
  project_id: 6,
  uploaded_by_id: 10,
  uploader_name: 'Aarav Patel',
  title: 'System Architecture Specification',
  document_type: 'DESIGN',
  file_name: 'architecture_diagram.pdf',
  file_size_bytes: 307200,
  mime_type: 'application/pdf',
  version: 1,
  created_at: '2026-09-10T00:00:00Z',
};

describe('Certificates and PDF Preview Feature Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Download Completion Certificate button when project is COMPLETED', async () => {
    vi.mocked(projectsApi.getProject).mockResolvedValue(mockProjectCompleted);

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/projects/6']}>
          <AuthContext.Provider
            value={{
              user: mockUser,
              activeRole: 'STUDENT',
              availableRoles: ['STUDENT'],
              isAuthenticated: true,
              isLoading: false,
              login: vi.fn(),
              logout: vi.fn(),
              switchRole: vi.fn(),
              refetchUser: vi.fn(),
            }}
          >
            <ToastProvider>
              <Routes>
                <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
              </Routes>
            </ToastProvider>
          </AuthContext.Provider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Download Completion Certificate/i })).toBeInTheDocument();
    });

    const certBtn = screen.getByRole('button', { name: /Download Completion Certificate/i });
    fireEvent.click(certBtn);

    await waitFor(() => {
      expect(certificatesApi.downloadProjectCertificate).toHaveBeenCalledWith(6, 'PRJ-2026-006');
    });
  });

  it('renders Certificate button on approved milestone and triggers milestone certificate download', async () => {
    vi.mocked(milestonesApi.getProjectMilestones).mockResolvedValue([mockMilestoneApproved, mockMilestonePending]);

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider
          value={{
            user: mockUser,
            activeRole: 'STUDENT',
            availableRoles: ['STUDENT'],
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
            switchRole: vi.fn(),
            refetchUser: vi.fn(),
          }}
        >
          <ToastProvider>
            <MilestonesTab project={mockProjectCompleted} />
          </ToastProvider>
        </AuthContext.Provider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Phase 1: Synopsis & System Specification/i)).toBeInTheDocument();
    });

    // Milestone 1 (Approved) has Certificate button
    const certButtons = screen.getAllByRole('button', { name: /Certificate/i });
    expect(certButtons.length).toBe(1);

    fireEvent.click(certButtons[0]);
    await waitFor(() => {
      expect(certificatesApi.downloadMilestoneCertificate).toHaveBeenCalledWith(
        1,
        'Phase 1: Synopsis & System Specification'
      );
    });
  });

  it('triggers inline document preview modal when clicking preview button', async () => {
    vi.mocked(documentsApi.getProjectDocuments).mockResolvedValue([mockDoc]);
    vi.mocked(documentsApi.fetchDocumentBlob).mockResolvedValue({
      blobUrl: 'blob:http://localhost:5173/dummy-pdf-blob',
      contentType: 'application/pdf',
    });

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider
          value={{
            user: mockUser,
            activeRole: 'STUDENT',
            availableRoles: ['STUDENT'],
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
            switchRole: vi.fn(),
            refetchUser: vi.fn(),
          }}
        >
          <ToastProvider>
            <DocumentsTab project={mockProjectCompleted} />
          </ToastProvider>
        </AuthContext.Provider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/architecture_diagram\.pdf/i)).toBeInTheDocument();
    });

    const previewBtn = screen.getByTitle('Preview Document');
    fireEvent.click(previewBtn);

    await waitFor(() => {
      expect(documentsApi.fetchDocumentBlob).toHaveBeenCalledWith(201);
      expect(screen.getByText(/Document Preview: System Architecture Specification/i)).toBeInTheDocument();
    });
  });
});
