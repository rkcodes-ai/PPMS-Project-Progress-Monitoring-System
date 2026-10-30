import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationDropdown } from '../features/notifications/NotificationDropdown';
import { notificationsApi } from '../api/notifications';
import { ToastProvider } from '../context/ToastContext';
import type { NotificationItem } from '../types';

vi.mock('../api/notifications', () => ({
  notificationsApi: {
    getNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

const mockNotifications: NotificationItem[] = [
  {
    id: 1,
    recipient_id: 10,
    event_type: 'TASK_ASSIGNED',
    title: 'New Task Assignment',
    message: 'You have been assigned to task: Dataset Preparation',
    resource_type: 'task',
    resource_id: 5,
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    recipient_id: 10,
    event_type: 'MENTOR_FEEDBACK',
    title: 'Progress Report Evaluated',
    message: 'Your progress report was approved with distinction.',
    resource_type: 'report',
    resource_id: 3,
    is_read: true,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

const renderNotificationDropdown = (unreadCount = 1) => {
  vi.mocked(notificationsApi.getUnreadCount).mockResolvedValueOnce({ unread_count: unreadCount });
  vi.mocked(notificationsApi.getNotifications).mockResolvedValue(mockNotifications);

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ToastProvider>
          <NotificationDropdown />
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('NotificationDropdown Feature Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders bell icon with unread count badge', async () => {
    renderNotificationDropdown(3);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Notifications/i })).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('opens notification dropdown on bell click and lists notifications', async () => {
    renderNotificationDropdown(1);

    const bellBtn = await screen.findByRole('button', { name: /Notifications/i });
    fireEvent.click(bellBtn);

    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('1 new')).toBeInTheDocument();
      expect(screen.getByText('New Task Assignment')).toBeInTheDocument();
      expect(screen.getByText('You have been assigned to task: Dataset Preparation')).toBeInTheDocument();
      expect(screen.getByText('Progress Report Evaluated')).toBeInTheDocument();
    });
  });

  it('triggers markAllAsRead when clicking Mark all read button', async () => {
    vi.mocked(notificationsApi.markAllAsRead).mockResolvedValueOnce({
      detail: 'All notifications marked as read',
      marked_count: 1,
    });
    renderNotificationDropdown(1);

    const bellBtn = await screen.findByRole('button', { name: /Notifications/i });
    fireEvent.click(bellBtn);

    const markAllBtn = await screen.findByRole('button', { name: /Mark all read/i });
    fireEvent.click(markAllBtn);

    await waitFor(() => {
      expect(notificationsApi.markAllAsRead).toHaveBeenCalled();
    });
  });
});
