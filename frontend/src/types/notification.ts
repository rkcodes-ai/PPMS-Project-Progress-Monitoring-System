export type NotificationEventTypeEnum =
  | 'PROPOSAL_DECISION'
  | 'TASK_ASSIGNED'
  | 'UPCOMING_DEADLINE'
  | 'OVERDUE_TASK'
  | 'NEW_PROGRESS_REPORT'
  | 'REVIEW_REQUEST'
  | 'MENTOR_FEEDBACK'
  | 'CORRECTION_REQUESTED'
  | 'MILESTONE_DECISION'
  | 'NEW_MESSAGE'
  | 'PROJECT_COMPLETED';

export interface NotificationItem {
  id: number;
  recipient_id: number;
  event_type: NotificationEventTypeEnum;
  title: string;
  message: string;
  resource_type?: 'project' | 'task' | 'milestone' | 'report' | 'message';
  resource_id?: number;
  is_read: boolean;
  created_at: string;
}

export interface UnreadCountResponse {
  unread_count: number;
}
