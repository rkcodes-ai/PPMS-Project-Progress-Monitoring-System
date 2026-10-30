import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DiscussionsTab } from '../features/discussions/DiscussionsTab';
import { communicationApi } from '../api/communication';
import { ToastProvider } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import type { ProjectDetail, ConversationItem, MessageItem, UserProfile } from '../types';

vi.mock('../api/communication', () => ({
  communicationApi: {
    getProjectConversations: vi.fn(),
    getConversationMessages: vi.fn(),
    sendMessage: vi.fn(),
    markConversationRead: vi.fn(),
    getConversationUnreadCount: vi.fn(),
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

const mockConversation: ConversationItem = {
  id: 1,
  title: 'PRJ-2026-001 Technical Discussion',
  conversation_type: 'PROJECT_DISCUSSION',
  project_id: 1,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-10-25T00:00:00Z',
  message_count: 2,
  unread_count: 0,
};

const mockMessages: MessageItem[] = [
  {
    id: 1,
    conversation_id: 1,
    sender_id: 2,
    sender_name: 'Dr. Aruna Sharma',
    sender_role: 'MENTOR',
    content: 'Welcome team. Please upload your architecture document.',
    created_at: '2026-10-24T10:00:00Z',
    is_own_message: false,
  },
  {
    id: 2,
    conversation_id: 1,
    sender_id: 10,
    sender_name: 'Aarav Patel',
    sender_role: 'STUDENT',
    content: 'Thank you professor, SRS has been submitted.',
    created_at: '2026-10-24T11:00:00Z',
    is_own_message: true,
  },
];

const renderComponent = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
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
          <DiscussionsTab project={mockProject} />
        </ToastProvider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

describe('DiscussionsTab Feature Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders conversation panel, message history and sender identities', async () => {
    vi.mocked(communicationApi.getProjectConversations).mockResolvedValue([mockConversation]);
    vi.mocked(communicationApi.getConversationMessages).mockResolvedValue(mockMessages);

    renderComponent();

    // Check conversation header and messages rendered
    await waitFor(() => {
      expect(screen.getByText(/PRJ-2026-001 Technical Discussion/i)).toBeInTheDocument();
      expect(screen.getByText(/Welcome team. Please upload your architecture document./i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Thank you professor, SRS has been submitted./i)).toBeInTheDocument();

    // Check sender identity
    expect(screen.getByText(/Dr. Aruna Sharma/i)).toBeInTheDocument();
    expect(screen.getByText(/MENTOR/i)).toBeInTheDocument();
    expect(screen.getByText(/Live sync active \(polling every 5s\)/i)).toBeInTheDocument();
  });

  it('allows user to type a message and triggers sendMessage API', async () => {
    vi.mocked(communicationApi.getProjectConversations).mockResolvedValue([mockConversation]);
    vi.mocked(communicationApi.getConversationMessages).mockResolvedValue(mockMessages);
    vi.mocked(communicationApi.sendMessage).mockResolvedValue({
      id: 3,
      conversation_id: 1,
      sender_id: 10,
      sender_name: 'Aarav Patel',
      sender_role: 'STUDENT',
      content: 'Here is the prototype link.',
      created_at: '2026-10-25T12:00:00Z',
      is_own_message: true,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Write a message to project collaborators/i)).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/Write a message to project collaborators/i);
    fireEvent.change(textarea, { target: { value: 'Here is the prototype link.' } });

    const sendBtn = screen.getByRole('button', { name: /Send Message/i });
    expect(sendBtn).not.toBeDisabled();
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(communicationApi.sendMessage).toHaveBeenCalledWith(1, {
        content: 'Here is the prototype link.',
      });
    });
  });

  it('displays empty state when discussion has no messages', async () => {
    vi.mocked(communicationApi.getProjectConversations).mockResolvedValue([mockConversation]);
    vi.mocked(communicationApi.getConversationMessages).mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/No discussion messages yet/i)).toBeInTheDocument();
    });
  });
});
