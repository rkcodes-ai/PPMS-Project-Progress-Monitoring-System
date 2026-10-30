import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DocumentsTab } from '../features/documents/DocumentsTab';
import { documentsApi } from '../api/documents';
import { ToastProvider } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import type { ProjectDetail, DocumentItem, UserProfile } from '../types';

vi.mock('../api/documents', () => ({
  documentsApi: {
    getProjectDocuments: vi.fn(),
    uploadDocument: vi.fn(),
    downloadDocument: vi.fn(),
    deleteDocument: vi.fn(),
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

const mockProject: ProjectDetail = {
  id: 1,
  code: 'PRJ-2026-001',
  title: 'AI-Based Student Performance Prediction',
  category: 'Machine Learning',
  department_id: 1,
  academic_year_id: 1,
  academic_year_name: 'Second Year',
  section_id: 1,
  section_code: 'Y2-CSE-A',
  section_name: 'CSE-A',
  team_lead_id: 10,
  team_lead_name: 'Aarav Patel',
  mentor_id: 2,
  mentor_name: 'Dr. Aruna Sharma',
  priority: 'HIGH',
  status: 'IN_PROGRESS',
  health_status: 'ON_TRACK',
  progress_percentage: 65.5,
  start_date: '2026-09-01T00:00:00Z',
  planned_completion_date: '2027-04-30T00:00:00Z',
  created_at: '2026-09-01T00:00:00Z',
  description: 'Predictive analytics platform.',
  objectives: 'Improve course outcomes.',
  members: [],
  task_count: 5,
  milestone_count: 3,
  report_count: 2,
};

const mockDocs: DocumentItem[] = [
  {
    id: 101,
    project_id: 1,
    uploaded_by_id: 10,
    uploader_name: 'Aarav Patel',
    title: 'Software Requirements Specification',
    document_type: 'REQUIREMENTS',
    file_name: 'srs_document_v1.pdf',
    file_size_bytes: 204800,
    mime_type: 'application/pdf',
    version: 1,
    created_at: '2026-09-10T10:00:00Z',
  },
  {
    id: 102,
    project_id: 1,
    uploaded_by_id: 10,
    uploader_name: 'Aarav Patel',
    title: 'High Level Architecture',
    document_type: 'DESIGN',
    file_name: 'architecture_diagram.png',
    file_size_bytes: 1048576,
    mime_type: 'image/png',
    version: 1,
    created_at: '2026-09-15T12:00:00Z',
  },
];

const renderDocumentsTab = (docs = mockDocs, user = mockUser) => {
  vi.mocked(documentsApi.getProjectDocuments).mockResolvedValueOnce(docs);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  const mockAuthContext = {
    user,
    token: 'test-token',
    activeRole: user.active_role,
    availableRoles: user.available_roles,
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    switchRole: vi.fn(),
    refetchUser: vi.fn(),
  };


  return render(
    <AuthContext.Provider value={mockAuthContext}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ToastProvider>
            <DocumentsTab project={mockProject} />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </AuthContext.Provider>
  );
};

describe('DocumentsTab Feature Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders list of documents with titles, types, and formatted sizes', async () => {
    renderDocumentsTab();

    await waitFor(() => {
      expect(screen.getByText('Project Documents & Deliverables')).toBeInTheDocument();
      expect(screen.getByText('Software Requirements Specification')).toBeInTheDocument();
      expect(screen.getByText('srs_document_v1.pdf • v1')).toBeInTheDocument();
      expect(screen.getByText('REQUIREMENTS')).toBeInTheDocument();
      expect(screen.getByText('200.0 KB')).toBeInTheDocument();

      expect(screen.getByText('High Level Architecture')).toBeInTheDocument();
      expect(screen.getByText('DESIGN')).toBeInTheDocument();
      expect(screen.getByText('1.0 MB')).toBeInTheDocument();
    });
  });

  it('renders empty state when no documents exist', async () => {
    renderDocumentsTab([]);

    await waitFor(() => {
      expect(screen.getByText('No project documents uploaded yet')).toBeInTheDocument();
      expect(screen.getByText('Upload First Document')).toBeInTheDocument();
    });
  });

  it('triggers document download on button click', async () => {
    vi.mocked(documentsApi.downloadDocument).mockResolvedValueOnce();
    renderDocumentsTab();

    await waitFor(() => {
      expect(screen.getByText('Software Requirements Specification')).toBeInTheDocument();
    });

    const downloadButtons = screen.getAllByTitle('Download Document');
    fireEvent.click(downloadButtons[0]);

    expect(documentsApi.downloadDocument).toHaveBeenCalledWith(101, 'srs_document_v1.pdf');
  });

  it('allows uploader to open deletion modal and delete document', async () => {
    vi.mocked(documentsApi.deleteDocument).mockResolvedValueOnce({
      detail: 'Document successfully deleted',
      document_id: 101,
    });
    renderDocumentsTab();

    await waitFor(() => {
      expect(screen.getByText('Software Requirements Specification')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Delete Document');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Confirm Document Deletion')).toBeInTheDocument();
      expect(screen.getByText('srs_document_v1.pdf')).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole('button', { name: /Delete File/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(documentsApi.deleteDocument).toHaveBeenCalledWith(101);
    });
  });
});
